import init, { Gamebuino } from "./pkg/wasm_gamebuino.js";
import background from "./background2.js";

let memory;
let loadWasmPromise = init().then(wasm => {
    memory = wasm.memory;
});

const keymap = [
    [83, 40], // down
    [65, 81, 37], // left
    [68, 39], // right
    [87, 90, 38], // up
    [74], // A
    [75], // B
    [85], // MENU
    [73] // HOME
];

const dpadX = 109;
const dpadY = 206;
const dpadDist = 87;

const aX = 639;
const aY = 223;

const bX = 716;
const bY = 189;

const menuX = 287;
const menuY = 372;

const homeX = 495;
const homeY = 372;

const btnDist = 40;

class GamebuinoEmulator extends HTMLElement {
    constructor() {
        super();        
        this.root = this.attachShadow({ mode: "open" });
        
        this.root.innerHTML = `
          <style>
            :host {
                display: inline-block;
                width: 788px;
                height: 428px;
            }

            #console {
                width: 788px;
                height: 428px;
                background-image: url('${background}');
                position: relative;
            }

            #gbscreen {
                position: absolute;
                top: 80px;
                left: 232px;
            }
        </style>
        <div id="console">
            <canvas id="gbscreen" width="320" height="256"></canvas>
        </div>
        `;    
        this.margintop = 0;
        this.marginleft = 0;
        
        this.setScale()
        
        this.canvas = this.root.getElementById("gbscreen");
        this.ctx = this.canvas.getContext("2d");
        this.ctx.scale(2, 2);
        this.ctx.imageSmoothingEnabled = false;

        this.imageData = this.ctx.getImageData(0, 0, 160, 128);

        this.buttonData = 0b11111111;
        this.lastTimestamp = 0;
        this.requestId;

        this.pointerPresses = {};

        this.nextAudioStart = 0;

        document.addEventListener("keydown", event => {
            this.initAudio();

            for (var i = 0; i < keymap.length; i++) {
                for (var code of keymap[i]) {
                    if (code == event.keyCode) {
                        event.preventDefault();
                        this.buttonData &= ~(1 << i);
                        return;
                    }
                }
            }
        });  

        document.addEventListener("keyup", event => {
            for (var i = 0; i < keymap.length; i++) {
                for (var code of keymap[i]) {
                    if (code == event.keyCode) {
                        this.buttonData |= 1 << i;
                        return;
                    }
                }
            }
        });
        
        window.addEventListener("resize", event => {
          this.setScale();
        });        

        const controls = this.root.getElementById("console");

        controls.addEventListener("pointerdown", event => {
            this.initAudio();

            this.handlePointerDown(event)
        });

        controls.addEventListener("pointermove", event =>
            this.handlePointerMove(event)
        );
        document.addEventListener("pointerup", event =>
            this.handlePointerUp(event)
        );
        document.addEventListener("pointercancel", event =>
            this.handlePointerUp(event)
        );

        this.start();
    }

    get src() {
        return this.getAttribute("src");
    }

    set src(value) {
        return this.setAttribute("src", value);
    }

    static get observedAttributes() {
        return ["src"];
    }

    get buttonState() {
        if (!navigator || !navigator.getGamepads) return this.buttonData;
        const gamepad = navigator.getGamepads()[0];
        if (!gamepad) return this.buttonData;

        let gamepadData = 0b11111111;
        if (gamepad.axes[0] < -.9 || gamepad.buttons[14].pressed) gamepadData &= 0b11111101;
        if (gamepad.axes[0] > .9 || gamepad.buttons[15].pressed) gamepadData &= 0b11111011;
        if (gamepad.axes[1] < -.9 || gamepad.buttons[12].pressed) gamepadData &= 0b11110111;
        if (gamepad.axes[1] > .9 || gamepad.buttons[13].pressed) gamepadData &= 0b11111110;
        if (gamepad.buttons[1].pressed || gamepad.buttons[3].pressed) gamepadData &= 0b11011111;
        if (gamepad.buttons[0].pressed || gamepad.buttons[2].pressed) gamepadData &= 0b11101111;
        if (gamepad.buttons[8].pressed) gamepadData &= 0b10111111;
        if (gamepad.buttons[9].pressed) gamepadData &= 0b01111111;

        return this.buttonData & gamepadData;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.start();
    }
       
    setScale() {          
          let elem = this.root.getElementById("console");
          let windowWidth = window.innerWidth && document.documentElement.clientWidth ? Math.min(window.innerWidth, document.documentElement.clientWidth) : window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
          let windowHeight = window.innerHeight && document.documentElement.clientHeight ? Math.min(window.innerHeight, document.documentElement.clientHeight) : window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;          
          this.scale = windowWidth / elem.clientWidth;          
          if (elem.clientHeight * this.scale > windowHeight)         
            this.scale = windowHeight / elem.clientHeight;
            
          this.margintop = ((windowHeight - (elem.clientHeight * this.scale)) / 2);
          this.marginleft = ((windowWidth - (elem.clientWidth * this.scale)) / 2);
          document.body.style = "margin: 0px; padding: 0px; overflow: hidden; width: 100%; height: 100%";
          elem.style="position: abosolute; transform-origin: 0 0; top:" + this.margintop + "px; left:" + this.marginleft + "px; transform: scale(" + this.scale + ")";
    }
        
    start(program) {
        let arrayBufferPromise;

        if (program) {
            arrayBufferPromise = Promise.resolve(program);
        } else {
            arrayBufferPromise = fetch(this.src)
                .then(response => response.arrayBuffer());
        }

        Promise.all([arrayBufferPromise, loadWasmPromise])
            .then(([buffer]) => {
                if (this.requestId) cancelAnimationFrame(this.requestId);
                if (this.gamebuino) this.gamebuino.free();
                this.gamebuino = Gamebuino.new();
                this.gamebuino.load_program(new Uint8Array(buffer), 0x4000);
                if (this.audioCtx) {
                    this.audioCtx.close();
                    this.audioCtx = undefined;
                }
                this.nextAudioStart = 0;
                this.step();
            }
        );
    }

    step(timestamp) {
        const goalTicksPerSecond = 20000000;
        const maxIterations = goalTicksPerSecond / 30;
        const delta = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        let iterations = (delta * goalTicksPerSecond) / 1000;
        if (iterations > maxIterations) iterations = maxIterations;

        this.gamebuino.run(iterations, this.buttonState);

        const buf8 = new Uint8ClampedArray(
            memory.buffer,
            this.gamebuino.image_pointer(),
            160 * 128 * 4
        );
        this.imageData.data.set(buf8);
        this.ctx.putImageData(this.imageData, 0, 0);
        this.ctx.drawImage(this.canvas, 0, 0);

        this.handleAudio();

        this.requestId = requestAnimationFrame(t => this.step(t));
    }

    squareDist(touch, x, y) {
        return (
            ((touch.pageX - this.marginleft) / this.scale - x) * ((touch.pageX - this.marginleft) / this.scale - x) + 
            ((touch.pageY - this.margintop) / this.scale - y) * ((touch.pageY - this.margintop) / this.scale - y)
        );
    }

    handlePointerDown(event) {
        event.preventDefault();
        this.pointerPresses[event.pointerId] = 0b11111111;
        this.handlePointerMove(event);
        this.updateButtonData();
    }

    handlePointerMove(event) {
        if (this.pointerPresses.hasOwnProperty(event.pointerId)) {
            this.pointerPresses[event.pointerId] = this.handlePointer(event);
        }
        this.updateButtonData();
    }

    handlePointerUp(event) {
        delete this.pointerPresses[event.pointerId];
        this.updateButtonData();
    }

    updateButtonData() {
        this.buttonData = 0b11111111;
        for (let prop in this.pointerPresses) {
            this.buttonData &= this.pointerPresses[prop];
        }
    }

    handlePointer(event) {
        if (this.squareDist(event, dpadX, dpadY) < dpadDist * dpadDist) {
            var angle = Math.atan2(
                dpadY - ((event.pageY - this.margintop) / this.scale),
                ((event.pageX - this.marginleft) / this.scale) - dpadX
            );

            if (angle < (-7 * Math.PI) / 8) {
                return 0b11111101;
            } else if (angle < (-5 * Math.PI) / 8) {
                return 0b11111100;
            } else if (angle < (-3 * Math.PI) / 8) {
                return 0b11111110;
            } else if (angle < -Math.PI / 8) {
                return 0b11111010;
            } else if (angle < Math.PI / 8) {
                return 0b11111011;
            } else if (angle < (3 * Math.PI) / 8) {
                return 0b11110011;
            } else if (angle < (5 * Math.PI) / 8) {
                return 0b11110111;
            } else if (angle < (7 * Math.PI) / 8) {
                return 0b11110101;
            } else {
                return 0b11111101;
            }
        } else if (this.squareDist(event, aX, aY) < btnDist * btnDist) {
            return 0b11101111;
        } else if (this.squareDist(event, bX, bY) < btnDist * btnDist) {
            return 0b11011111;
        } else if (this.squareDist(event, menuX, menuY) < btnDist * btnDist) {
            return 0b10111111;
        } else if (this.squareDist(event, homeX, homeY) < btnDist * btnDist) {
            return 0b01111111;
        }

        return 0b11111111;
    }

    initAudio() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!this.audioCtx && AudioContext) {
            console.log("Audio sample rate = ", this.gamebuino.sample_rate);
            this.audioCtx = new AudioContext({ sampleRate: this.gamebuino.sample_rate });
            this.audioCtx.resume();
        }
    }

    handleAudio() {
        if (!this.audioCtx) return;
        const frameCount = this.gamebuino.sound_samples;
        if (frameCount === 0) return;
        const raw = new Uint16Array(memory.buffer, this.gamebuino.sound_data_pointer(), frameCount);
        const audioBuffer = this.audioCtx.createBuffer(1, frameCount, this.audioCtx.sampleRate);
        const channelBuffer = audioBuffer.getChannelData(0);
        const source = this.audioCtx.createBufferSource();

        for (let i = 0; i < frameCount; i++) {
            channelBuffer[i] = raw[i] / 1024;
        }

        source.buffer = audioBuffer;
        source.connect(this.audioCtx.destination);
        if (this.audioCtx.currentTime > this.nextAudioStart) {
            this.nextAudioStart = this.audioCtx.currentTime;
        }
        source.start(this.nextAudioStart);
        this.nextAudioStart += audioBuffer.duration;
    }
}

customElements.define("gamebuino-emulator", GamebuinoEmulator);
