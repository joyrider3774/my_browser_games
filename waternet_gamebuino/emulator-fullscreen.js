import init, { Gamebuino } from "./pkg/wasm_gamebuino.js";

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

class GamebuinoEmulator extends HTMLElement {
    constructor() {
        super();
        
        let elem = document.querySelector("gamebuino-emulator");
        this.rescale = elem ? elem.dataset.fittowindow == "1" : false;
        
        this.root = this.attachShadow({ mode: "open" });
        
        let html = `
        <style>
          body,html {
             margin: 0;
             padding: 0;
          }

          .fullscreen {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            background-color: black;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .fullscreen canvas {
            object-fit: contain;
            height: 100%;
            width: 100%;
          }
          
          </style>
          <div id="console" class="fullscreen">
              <canvas id="gbscreen" width="320" height="256"></canvas>
          </div>
        `;
        this.root.innerHTML = html;     
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
