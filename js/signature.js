/**
 * Stride Mobility - Smooth Touch Signature Pad
 * High-DPI, Bezier Spline Curves, Undo/Clear, and Fullscreen Landscape Mode
 */

class SignaturePad {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    const isDark = typeof document !== 'undefined' && document.documentElement && document.documentElement.getAttribute('data-theme') !== 'light';
    this.options = Object.assign({
      penColor: isDark ? '#ffffff' : '#0a0f18',
      lineWidth: 2.8,
      onBegin: null,
      onEnd: null,
      onChange: null
    }, options);

    this.points = [];
    this.strokes = []; // Array of strokes for undo: [ [{x,y}, ...], ... ]
    this.isDrawing = false;
    this.dpr = window.devicePixelRatio || 1;

    this.initCanvas();
    this.bindEvents();
  }

  initCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || 340;
    const height = rect.height || 180;

    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.options.penColor;
    this.ctx.lineWidth = this.options.lineWidth;

    this.redraw();
  }

  resize() {
    this.resizeAndRedraw();
  }

  bindEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      let clientX = e.clientX;
      let clientY = e.clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      }
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const handleStart = (e) => {
      if (e.cancelable) e.preventDefault();
      this.isDrawing = true;
      const pos = getPos(e);
      this.points = [pos];
      this.currentStroke = [pos];

      if (typeof this.options.onBegin === 'function') {
        this.options.onBegin();
      }
    };

    const handleMove = (e) => {
      if (!this.isDrawing) return;
      if (e.cancelable) e.preventDefault();
      const pos = getPos(e);
      this.points.push(pos);
      this.currentStroke.push(pos);

      if (this.points.length >= 3) {
        const len = this.points.length;
        const xc = (this.points[len - 2].x + this.points[len - 1].x) / 2;
        const yc = (this.points[len - 2].y + this.points[len - 1].y) / 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.points[len - 3].x, this.points[len - 3].y);
        this.ctx.quadraticCurveTo(this.points[len - 2].x, this.points[len - 2].y, xc, yc);
        this.ctx.stroke();
      } else if (this.points.length === 2) {
        this.ctx.beginPath();
        this.ctx.moveTo(this.points[0].x, this.points[0].y);
        this.ctx.lineTo(this.points[1].x, this.points[1].y);
        this.ctx.stroke();
      }
    };

    const handleEnd = (e) => {
      if (!this.isDrawing) return;
      if (e && e.cancelable) e.preventDefault();
      this.isDrawing = false;

      if (this.currentStroke && this.currentStroke.length > 0) {
        // If it was just a dot
        if (this.currentStroke.length === 1) {
          const pt = this.currentStroke[0];
          this.ctx.beginPath();
          this.ctx.arc(pt.x, pt.y, this.options.lineWidth / 2, 0, Math.PI * 2);
          this.ctx.fillStyle = this.options.penColor;
          this.ctx.fill();
        }
        this.strokes.push([...this.currentStroke]);
      }
      this.currentStroke = [];
      this.points = [];

      if (typeof this.options.onEnd === 'function') {
        this.options.onEnd();
      }
      if (typeof this.options.onChange === 'function') {
        this.options.onChange(this.isEmpty());
      }
    };

    // Use Pointer Events for unified touch, pen, and mouse handling
    if (typeof window !== 'undefined' && window.PointerEvent) {
      this.canvas.addEventListener('pointerdown', (e) => {
        if (e.isPrimary === false) return;
        try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
        handleStart(e);
      });
      this.canvas.addEventListener('pointermove', (e) => {
        if (e.isPrimary === false) return;
        handleMove(e);
      });
      this.canvas.addEventListener('pointerup', (e) => {
        try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        handleEnd(e);
      });
      this.canvas.addEventListener('pointercancel', (e) => {
        try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        handleEnd(e);
      });
    } else {
      // Fallback for older browsers
      this.canvas.addEventListener('touchstart', handleStart, { passive: false });
      this.canvas.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('touchcancel', handleEnd);

      this.canvas.addEventListener('mousedown', handleStart);
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
    }

    // Window resize observer
    window.addEventListener('resize', () => {
      this.resizeAndRedraw();
    });
  }

  resizeAndRedraw() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.options.penColor;
    this.ctx.lineWidth = this.options.lineWidth;
    this.redraw();
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
    if (!this.strokes || this.strokes.length === 0) return;

    for (const stroke of this.strokes) {
      if (stroke.length === 0) continue;
      if (stroke.length === 1) {
        const pt = stroke[0];
        this.ctx.beginPath();
        this.ctx.arc(pt.x, pt.y, this.options.lineWidth / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = this.options.penColor;
        this.ctx.fill();
        continue;
      }

      this.ctx.beginPath();
      this.ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length - 1; i++) {
        const xc = (stroke[i].x + stroke[i + 1].x) / 2;
        const yc = (stroke[i].y + stroke[i + 1].y) / 2;
        this.ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, xc, yc);
      }
      this.ctx.lineTo(stroke[stroke.length - 1].x, stroke[stroke.length - 1].y);
      this.ctx.stroke();
    }
  }

  clear() {
    this.strokes = [];
    this.points = [];
    this.ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
    if (typeof this.options.onChange === 'function') {
      this.options.onChange(true);
    }
  }

  undo() {
    if (this.strokes.length > 0) {
      this.strokes.pop();
      this.redraw();
      if (typeof this.options.onChange === 'function') {
        this.options.onChange(this.isEmpty());
      }
    }
  }

  isEmpty() {
    return !this.strokes || this.strokes.length === 0;
  }

  setStrokes(strokes) {
    this.strokes = JSON.parse(JSON.stringify(strokes || []));
    this.redraw();
    if (typeof this.options.onChange === 'function') {
      this.options.onChange(this.isEmpty());
    }
  }

  getStrokes() {
    return JSON.parse(JSON.stringify(this.strokes));
  }

  /**
   * Generates a high-contrast dark navy transparent PNG trimmed tightly to the stroke bounding box.
   * Eliminates dead whitespace so the signature scales naturally whether signed in portrait or landscape!
   */
  toDataURL() {
    if (this.isEmpty()) return null;

    // 1. Calculate tight bounding box across all points in all strokes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const stroke of this.strokes) {
      for (const pt of stroke) {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
    }

    if (minX === Infinity || minY === Infinity) return null;

    // 2. Add padding around the bounding box
    const pad = 6;
    const boxX = Math.max(0, minX - pad);
    const boxY = Math.max(0, minY - pad);
    const rawW = maxX - minX;
    const rawH = maxY - minY;
    const boxW = Math.max(24, rawW + pad * 2);
    const boxH = Math.max(12, rawH + pad * 2);

    // 3. Create a temporary canvas matching the tight bounding box
    const tempCanvas = document.createElement('canvas');
    const scale = 3; // Ultra high-resolution 3x retina export
    tempCanvas.width = Math.ceil(boxW * scale);
    tempCanvas.height = Math.ceil(boxH * scale);
    const tCtx = tempCanvas.getContext('2d');
    tCtx.scale(scale, scale);
    tCtx.translate(-boxX, -boxY);

    tCtx.lineCap = 'round';
    tCtx.lineJoin = 'round';
    tCtx.strokeStyle = '#0b1d3a';
    tCtx.lineWidth = this.options.lineWidth * 1.05;

    for (const stroke of this.strokes) {
      if (stroke.length === 0) continue;
      if (stroke.length === 1) {
        const pt = stroke[0];
        tCtx.beginPath();
        tCtx.arc(pt.x, pt.y, (this.options.lineWidth * 1.05) / 2, 0, Math.PI * 2);
        tCtx.fillStyle = '#0b1d3a';
        tCtx.fill();
        continue;
      }
      tCtx.beginPath();
      tCtx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length - 1; i++) {
        const xc = (stroke[i].x + stroke[i + 1].x) / 2;
        const yc = (stroke[i].y + stroke[i + 1].y) / 2;
        tCtx.quadraticCurveTo(stroke[i].x, stroke[i].y, xc, yc);
      }
      tCtx.lineTo(stroke[stroke.length - 1].x, stroke[stroke.length - 1].y);
      tCtx.stroke();
    }

    return tempCanvas.toDataURL('image/png');
  }
}

window.SignaturePad = SignaturePad;
window.StrideSignaturePad = SignaturePad;
