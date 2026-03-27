/**
 * ZbyszekX Clock Renderer Module
 * Renders SVG-based watch face with customizable backgrounds
 * 
 * Usage:
 *   const clock = new ClockRenderer(containerElement, options);
 *   clock.setTime(hour, minute);
 *   clock.setBackground('solid' | 'spiral' | 'grid' | 'tech');
 */

class ClockRenderer {
  // Hand color palette
  static HAND_COLORS = {
    white: '#f0f0f0',
    blue: '#2563eb',
    red: '#d82928',
  };

  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      size: options.size || 'normal', // 'sm', 'normal', 'lg'
      interactive: options.interactive || false,
      showBrand: options.showBrand !== false,
      showDigital: options.showDigital !== false,
      showDate: options.showDate !== false,
      showAmPm: options.showAmPm || false,
      showSecondHand: options.showSecondHand || false,
      showBgControls: options.showBgControls || false,
      bgControlsContainer: options.bgControlsContainer || null,
      onTimeChange: options.onTimeChange || null,
      handColor: options.handColor || 'white',
    };

    this.time = { h: 12, m: 0 };
    this.isDragging = false;
    this.activeHand = null;
    this.ghostTime = null;
    this.secondInterval = null;
    this._hourDeg = null;
    this._minuteDeg = null;

    this.init();
  }

  init() {
    this.render();
    this.cacheElements();
    this.generateTicks();
    this.updateDate();
    
    if (this.options.interactive) {
      this.setupInteraction();
    }
    
    if (this.options.showSecondHand) {
      this.startSecondHand();
    }
    
    if (this.options.showBgControls) {
      this.renderBgControls();
    }
    
    this.updateHands();
    this.setHandColor(this.options.handColor);
  }

  render() {
    const sizeClass = this.options.size === 'sm' ? 'clock-sm' : 
                      this.options.size === 'lg' ? 'clock-lg' : '';
    const interactiveClass = this.options.interactive ? 'interactive' : '';

    this.container.innerHTML = `
      <div class="clock ${sizeClass} ${interactiveClass}">
        <!-- Background Layers -->
        <div class="bg-layer bg-solid active" data-bg="solid"></div>
        <div class="bg-layer bg-spiral" data-bg="spiral"></div>
        <div class="bg-layer bg-grid" data-bg="grid"></div>
        <div class="bg-layer bg-tech" data-bg="tech"></div>

        ${this.options.showBrand ? '<div class="brand">ZbyszekX</div>' : ''}
        
        ${this.options.showAmPm ? '<div class="ampm-display"></div>' : ''}

        ${this.options.showDigital ? `
        <div class="digital-display">
          <div class="digital-time"></div>
          ${this.options.showDate ? '<div class="digital-date"></div>' : ''}
        </div>
        ` : ''}
        
        <div class="numbers">
          <div class="num n12">12</div>
          <div class="num n1">1</div>
          <div class="num n2">2</div>
          <div class="num n3">3</div>
          <div class="num n4">4</div>
          <div class="num n5">5</div>
          <div class="num n6">6</div>
          <div class="num n7">7</div>
          <div class="num n8">8</div>
          <div class="num n9">9</div>
          <div class="num n10">10</div>
          <div class="num n11">11</div>
        </div>

        <svg class="overlay" viewBox="0 0 400 400">
          <defs>
            <line id="t_min_${this.container.id}" x1="200" y1="6" x2="200" y2="14" stroke="#dddddd" stroke-width="1.5" />
            <line id="t_hour_${this.container.id}" x1="200" y1="6" x2="200" y2="22" stroke="#ffffff" stroke-width="5" />
          </defs>

          <g class="ticks"></g>

          <!-- Ghost hands for showing correct answers -->
          <g class="ghost-hands" style="display: none;">
            <g class="ghost-hour">
              <polygon points="190,200 210,200 202,88 198,88" fill="#16a34a" />
            </g>
            <g class="ghost-minute">
              <polygon points="194,200 206,200 210,248 190,248" fill="#16a34a" />
              <polygon points="194,200 206,200 202,24 198,24" fill="#16a34a" />
            </g>
          </g>

          <!-- Main Hands -->
          <g class="main-hands">
            <!-- Hour Hand -->
            <g class="hour-hand" transform="rotate(0, 200, 200)">
              <polygon class="hand-fill" points="190,200 210,200 202,88 198,88" fill="${ClockRenderer.HAND_COLORS[this.options.handColor]}" />
            </g>
            <!-- Minute Hand -->
            <g class="minute-hand" transform="rotate(0, 200, 200)">
              <polygon points="194,200 206,200 210,248 190,248" fill="#2c3531" />
              <polygon class="hand-fill" points="194,200 206,200 202,24 198,24" fill="${ClockRenderer.HAND_COLORS[this.options.handColor]}" />
              <circle cx="200" cy="200" r="22" fill="#2c3531" />
              <circle cx="200" cy="200" r="10" fill="#0b0b0b" />
            </g>
            <!-- Second Hand -->
            ${this.options.showSecondHand ? `
            <g class="second-hand" transform="rotate(0, 200, 200)">
              <rect x="199" y="24" width="2" height="176" fill="#ffffff" />
              <rect x="199" y="200" width="2" height="36" fill="#ffffff" />
              <circle cx="200" cy="200" r="4" fill="#ffffff" />
              <circle cx="200" cy="200" r="2" fill="#0b0b0b" />
            </g>
            ` : ''}
          </g>
        </svg>
      </div>
    `;
  }

  cacheElements() {
    this.clockEl = this.container.querySelector('.clock');
    this.hourHand = this.container.querySelector('.hour-hand');
    this.minuteHand = this.container.querySelector('.minute-hand');
    this.secondHand = this.container.querySelector('.second-hand');
    this.digitalTime = this.container.querySelector('.digital-time');
    this.digitalDate = this.container.querySelector('.digital-date');
    this.ampmDisplay = this.container.querySelector('.ampm-display');
    this.ghostHands = this.container.querySelector('.ghost-hands');
    this.ghostHourHand = this.container.querySelector('.ghost-hour');
    this.ghostMinuteHand = this.container.querySelector('.ghost-minute');
    this.bgLayers = this.container.querySelectorAll('.bg-layer');
    this.handFills = this.container.querySelectorAll('.hand-fill');
  }

  generateTicks() {
    const ticksGroup = this.container.querySelector('.ticks');
    const containerId = this.container.id;
    
    for (let i = 0; i < 60; i++) {
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", i % 5 === 0 ? `#t_hour_${containerId}` : `#t_min_${containerId}`);
      use.setAttribute("transform", `rotate(${i * 6}, 200, 200)`);
      ticksGroup.appendChild(use);
    }
  }

  updateDate() {
    const now = new Date();
    const days = ['Ndz', 'Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob'];
    const months = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
    if (this.digitalTime) {
      this.digitalTime.textContent = days[now.getDay()];
    }
    if (this.digitalDate) {
      this.digitalDate.textContent = `${months[now.getMonth()]} ${now.getDate()}`;
    }
  }

  renderBgControls() {
    const targetContainer = this.options.bgControlsContainer || this.container;
    
    const controlsHtml = `
      <div class="bg-controls">
        <div class="bg-btn p-solid active" data-bg="solid" title="Czarne tło"></div>
        <div class="bg-btn p-spiral" data-bg="spiral" title="Spirala"></div>
        <div class="bg-btn p-grid" data-bg="grid" title="Siatka"></div>
        <div class="bg-btn p-tech" data-bg="tech" title="Tech"></div>
      </div>
    `;
    
    if (this.options.bgControlsContainer) {
      targetContainer.innerHTML = controlsHtml;
    } else {
      this.container.insertAdjacentHTML('beforeend', controlsHtml);
    }
    
    // Add event listeners
    const buttons = targetContainer.querySelectorAll('.bg-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.setBackground(btn.dataset.bg);
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  setBackground(type) {
    this.bgLayers.forEach(layer => {
      layer.classList.toggle('active', layer.dataset.bg === type);
    });
  }

  setHandColor(color) {
    const hex = ClockRenderer.HAND_COLORS[color];
    if (!hex) return;
    this.options.handColor = color;
    this.handFills.forEach(polygon => {
      polygon.setAttribute('fill', hex);
    });
    if (this.digitalDate) {
      this.digitalDate.style.color = hex;
    }
  }

  getHandColor() {
    return this.options.handColor;
  }

  setTime(hour, minute) {
    this.time.h = hour;
    this.time.m = minute;
    this.updateHands();
    this.updateDigitalDisplay();
  }

  getTime() {
    return { ...this.time };
  }

  updateHands() {
    const totalHour = (this.time.h % 12) + this.time.m / 60;
    const rawHourDeg = (totalHour / 12) * 360;
    const rawMinuteDeg = (this.time.m / 60) * 360;

    if (this._hourDeg === null || this.isDragging) {
      // Initial state or dragging: snap directly, no transition
      this._hourDeg = rawHourDeg;
      this._minuteDeg = rawMinuteDeg;
    } else {
      // Shortest-path normalization to avoid wrong-direction spin
      const normH = ((this._hourDeg % 360) + 360) % 360;
      let diffH = rawHourDeg - normH;
      if (diffH > 180) diffH -= 360;
      if (diffH < -180) diffH += 360;
      this._hourDeg += diffH;

      const normM = ((this._minuteDeg % 360) + 360) % 360;
      let diffM = rawMinuteDeg - normM;
      if (diffM > 180) diffM -= 360;
      if (diffM < -180) diffM += 360;
      this._minuteDeg += diffM;
    }

    this.hourHand.style.transform = `rotate(${this._hourDeg}deg)`;
    this.minuteHand.style.transform = `rotate(${this._minuteDeg}deg)`;
  }

  updateDigitalDisplay() {
    // Digital time slot shows day of week — no update needed here
  }

  startSecondHand() {
    if (!this.secondHand) return;
    
    const updateSecond = () => {
      const seconds = new Date().getSeconds();
      const secondDeg = (seconds / 60) * 360;
      this.secondHand.setAttribute('transform', `rotate(${secondDeg}, 200, 200)`);
    };
    
    updateSecond();
    this.secondInterval = setInterval(updateSecond, 1000);
  }

  stopSecondHand() {
    if (this.secondInterval) {
      clearInterval(this.secondInterval);
      this.secondInterval = null;
    }
  }

  // Show ghost hands at a specific position (for showing correct answers)
  showGhostHands(hour, minute) {
    if (!this.ghostHands) return;
    
    this.ghostHands.style.display = 'block';
    
    const totalHour = (hour % 12) + minute / 60;
    const hourDeg = (totalHour / 12) * 360;
    this.ghostHourHand.setAttribute('transform', `rotate(${hourDeg}, 200, 200)`);
    
    const minuteDeg = (minute / 60) * 360;
    this.ghostMinuteHand.setAttribute('transform', `rotate(${minuteDeg}, 200, 200)`);
  }

  hideGhostHands() {
    if (this.ghostHands) {
      this.ghostHands.style.display = 'none';
    }
  }

  // Interactive drag functionality
  setupInteraction() {
    this.clockEl.addEventListener("mousedown", (e) => this.handleStart(e));
    this.clockEl.addEventListener("mousemove", (e) => this.handleMove(e));
    window.addEventListener("mouseup", () => this.handleEnd());
    this.clockEl.addEventListener("touchstart", (e) => this.handleStart(e), { passive: false });
    this.clockEl.addEventListener("touchmove", (e) => this.handleMove(e), { passive: false });
    window.addEventListener("touchend", () => this.handleEnd());
    // Forward clicks in ampm zone to the ampm-display element
    this.clockEl.addEventListener("click", (e) => {
      if (!this.ampmDisplay) return;
      const pos = this.getMousePos(e);
      // ampm-display: left 22%, top 42%, size 16% of 400px clock → center (-80, 0), radius 32
      const dx = pos.x - (-80);
      const dy = pos.y - 0;
      if (Math.sqrt(dx * dx + dy * dy) <= 32) {
        this.ampmDisplay.dispatchEvent(new MouseEvent('click', { bubbles: false }));
      }
    });
  }

  getMousePos(evt) {
    const rect = this.clockEl.getBoundingClientRect();
    const scale = 400 / rect.width;
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return {
      x: (clientX - rect.left) * scale - 200,
      y: (clientY - rect.top) * scale - 200,
    };
  }

  handleStart(evt) {
    if (this.ampmDisplay) {
      const pos = this.getMousePos(evt);
      const dx = pos.x - (-80);
      const dy = pos.y - 0;
      if (Math.sqrt(dx * dx + dy * dy) <= 32) return;
    }
    evt.preventDefault();
    const pos = this.getMousePos(evt);
    const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
    const radius = 180;
    
    if (dist < radius) {
      const mouseAngle = this.getAngle(pos.x, pos.y);
      const minuteAngle = (this.time.m * Math.PI) / 30;
      const totalHour = (this.time.h % 12) + this.time.m / 60;
      const hourAngle = (totalHour * Math.PI) / 6;
      
      const distToMinute = this.angleDistance(mouseAngle, minuteAngle);
      const distToHour = this.angleDistance(mouseAngle, hourAngle);
      const threshold = 0.4;
      
      if (distToMinute < threshold && dist > radius * 0.4) {
        this.isDragging = true;
        this.activeHand = 'minute';
        this.clockEl.classList.add('dragging');
      } else if (distToHour < threshold && dist < radius * 0.65) {
        this.isDragging = true;
        this.activeHand = 'hour';
        this.clockEl.classList.add('dragging');
      }
    }
  }

  handleMove(evt) {
    if (!this.isDragging) return;
    evt.preventDefault();
    const pos = this.getMousePos(evt);
    const angle = this.getAngle(pos.x, pos.y);
    this.updateTimeFromAngle(angle);
  }

  handleEnd() {
    this.isDragging = false;
    this.activeHand = null;
    if (this.clockEl) this.clockEl.classList.remove('dragging');
  }

  getAngle(x, y) {
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;
    return angle;
  }

  angleDistance(a1, a2) {
    let diff = Math.abs(a1 - a2);
    return Math.min(diff, Math.PI * 2 - diff);
  }

  updateTimeFromAngle(angle) {
    if (this.activeHand === 'minute') {
      const prevM = this.time.m;
      let rawMinutes = (angle / (Math.PI * 2)) * 60;
      this.time.m = Math.round(rawMinutes) % 60;

      const diff = this.time.m - prevM;
      if (diff < -30) {
        this.time.h = (this.time.h % 12) + 1;
      } else if (diff > 30) {
        this.time.h = this.time.h - 1;
        if (this.time.h === 0) this.time.h = 12;
      }
    } else if (this.activeHand === 'hour') {
      let rawHours = (angle / (Math.PI * 2)) * 12;
      let newHour = Math.round(rawHours);
      if (newHour === 0) newHour = 12;
      this.time.h = newHour;
    }

    this.updateHands();
    this.updateDigitalDisplay();
    
    if (this.options.onTimeChange) {
      this.options.onTimeChange(this.time.h, this.time.m);
    }
  }

  // Set number style: 'arabic' | 'roman' | 'none'
  setNumberStyle(style) {
    const ROMAN = { 1:'I', 2:'II', 3:'III', 4:'IV', 5:'V', 6:'VI',
                    7:'VII', 8:'VIII', 9:'IX', 10:'X', 11:'XI', 12:'XII' };
    const nums = this.container.querySelectorAll('.numbers .num');
    nums.forEach(el => {
      if (style === 'none') {
        el.style.visibility = 'hidden';
      } else {
        el.style.visibility = '';
        if (style === 'roman') {
          const n = parseInt(el.className.match(/n(\d+)/)[1]);
          el.textContent = ROMAN[n];
        } else {
          const n = parseInt(el.className.match(/n(\d+)/)[1]);
          el.textContent = n;
        }
      }
    });
  }

  // Set AM/PM sub-dial: true = PM (moon), false = AM (sun)
  setAmPm(isPm) {
    if (!this.ampmDisplay) return;
    if (isPm) {
      this.ampmDisplay.innerHTML = `<svg viewBox="0 0 24 24" fill="#b0c8e8" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    } else {
      this.ampmDisplay.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#f9d44a" stroke-width="2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="4" fill="#f9d44a" stroke="none"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/><line x1="19.78" y1="4.22" x2="17.66" y2="6.34"/><line x1="6.34" y1="17.66" x2="4.22" y2="19.78"/></svg>`;
    }
  }

  // Format time as string
  formatTime(hour = this.time.h, minute = this.time.m) {
    const h = String(hour).padStart(2, "0");
    const m = String(minute).padStart(2, "0");
    return `${h}:${m}`;
  }

  // Cleanup
  destroy() {
    this.stopSecondHand();
    this.container.innerHTML = '';
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClockRenderer;
}
