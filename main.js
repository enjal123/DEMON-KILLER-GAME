class IntroScene extends Phaser.Scene {
    constructor() { super({ key: 'IntroScene' }); }
 
    preload() {
        // Load any intro images you want to flash on screen.
        // Replace the placeholder strings with your actual file paths.
        // Use an existing background/family image from the project to avoid 404s.
        this.load.image('intro_family',   'Assets/dead family.webp');
        this.load.image('intro_cave',     'Assets/cave entrance.webp');
    }
 
    create() {
        const W = this.scale.width;
        const H = this.scale.height;
 
        this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0, 0).setDepth(0);
 
        // Overlay rectangle used for fade-ins/outs (starts black, fades out so text is visible)
        this._fade = this.add.rectangle(0, 0, W, H, 0x000000, 1).setOrigin(0, 0).setDepth(50);
        this.tweens.add({ targets: this._fade, alpha: 0, duration: 900 });

        // Main narration text — centred, large, white
        this._txt = this.add.text(W / 2, H / 2, '', {
            fontSize: '28px',
            fontFamily: 'Georgia, serif',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: W * 0.72 }
        }).setOrigin(0.5).setDepth(10).setAlpha(0);

        this._hint = this.add.text(W / 2, H - 48, 'SPACE / M — SKIP TEXT OR CUTSCENE', {
            fontSize: '18px',
            fontFamily: 'Arial Black, sans-serif',
            fill: '#aaaaaa',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(11).setAlpha(0);
        this.tweens.add({ targets: this._hint, alpha: 0.7, duration: 600, delay: 1200, yoyo: true, repeat: -1 });

        // Ambient sound (Web Audio oscillators — no file needed)
        this._ac = null;
        this._ambientNodes = [];
        this._startAmbient();
 
        // Space key to advance
        this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this._skipKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        this._canAdvance = false;
        this._typing = false;
        this._segText = '';
        this._typeOnDone = null;
        this._segmentIndex = 0;
        this._typeTimer = null;
        this._imgObj = null;   // currently visible flash image
 
        // Build the full script
        this._script = this._buildScript();
        this._runSegment(0);

        this.input.on('pointerdown', () => this._onAdvanceInput());
        this.events.on('shutdown', () => this._stopAmbient());
    }
 
    // ── Ambient synth sound ────────────────────────────────────────────────
    _startAmbient() {
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            this._ac = new AC();
            // Low wind drone
            const o = this._ac.createOscillator();
            const g = this._ac.createGain();
            o.type = 'sawtooth';
            o.frequency.value = 60;
            g.gain.value = 0.015;
            o.connect(g);
            g.connect(this._ac.destination);
            o.start();
            this._ambientNodes.push(o, g);
        } catch(e) { /* ignore */ }
    }
    _stopAmbient() {
        try {
            this._ambientNodes.forEach(n => { try { n.disconnect(); } catch(e){} });
        } catch(e){}
        this._ambientNodes = [];
    }
    _playHeartbeat() {
        if (!this._ac) return;
        const beat = (t) => {
            const o = this._ac.createOscillator();
            const g = this._ac.createGain();
            o.type = 'sine';
            o.frequency.value = 55;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.28, t + 0.04);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            o.connect(g); g.connect(this._ac.destination);
            o.start(t); o.stop(t + 0.4);
        };
        const now = this._ac.currentTime;
        beat(now); beat(now + 0.4);
        beat(now + 1.2); beat(now + 1.6);
        beat(now + 2.4); beat(now + 2.8);
    }
    _playThunder() {
        if (!this._ac) return;
        const t = this._ac.currentTime;
        const buf = this._ac.createBuffer(1, this._ac.sampleRate * 1.2, this._ac.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
        const src = this._ac.createBufferSource();
        src.buffer = buf;
        const g = this._ac.createGain();
        g.gain.setValueAtTime(0.7, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        src.connect(g); g.connect(this._ac.destination);
        src.start(t);
    }
 // ── Script builder ─────────────────────────────────────────────────────
    // Each segment: { text, pause (ms before SPACE activates), sound, showImg, hideImg, title }
    _buildScript() {
        const S = (text, extra = {}) => ({ text, pause: extra.pause || 0, ...extra });
        const M = (text, extra = {}) => S(`Mysterious Man: ${text}`, extra);
        return [
            // ── Scene 1 ── Peaceful Beginning
            S('"My name is Enjalandro."'),
            S('"I was born in a small village hidden beyond the forests."'),
            S('"My family never had much…"'),
            S('"But they always gave me everything they could."'),
            S('"I promised them one day I\'d build a better life for us."'),
            S('"Tomorrow, I leave for the city to earn money for my family."'),
            S('"It\'s only a short trip."'),
            S('"I\'ll be back before they know it."', { pause: 1200 }),
            S('"They\'re the reason I keep going."'),
 
            // ── Scene 2 ── Three Days Later
            S('"Three days later…"', { pause: 600 }),
            S('"The roads felt colder than before."'),
            S('"The forest was… silent."'),
            S('"Too silent."'),
            S('"I felt something was wrong."'),
            S('"…Blood."', { pause: 900, sound: 'heartbeat' }),
            S('"I could smell blood."', { pause: 500 }),
 
            // ── Scene 3 ── Family Reveal
            S('"No…"', { showImg: 'intro_family', flashImg: true, pause: 400 }),
            S('"NO…"'),
            S('"MOM?!"'),
            S('"GET UP!!"', { hideImg: true }),
            S('"PLEASE!!"'),
            S('"I WAS TOO LATE!!"', { pause: 800 }),
            S('"Who did this…?"'),
            S('"WHO DID THIS TO MY FAMILY?!"'),
            S('"I\'LL KILL THEM!!"'),
            S('"I\'LL KILL EVERY LAST ONE OF THEM!!"', { pause: 600 }),
 
            // ── Scene 4 ── The Mysterious Man
            M('"You seek vengeance."'),
            S('"Who are you?!"'),
            M('"The creatures who killed your family… were demons."', { sound: 'thunder', pause: 800 }),
            S('"Demons?"'),
            M('"They exist in secret."'),
            M('"Hidden from humanity."'),
            M('"They feed in darkness while the world remains blind."'),
            S('"Tell me where they are. I\'ll kill them."'),
            M('"Hatred alone will get you killed."'),
            M('"If you truly seek revenge…"'),
            M('"Then survive."', { pause: 1000 }),
 
            // ── Scene 5 ── Training Arc
            S('"For one year…"'),
            S('"He trained me."'),
            S('"He taught me how demons think."'),
            S('"How they hunt."'),
            S('"How they kill."'),
            S('"And how to kill them."'),
            S('"I gave up everything."'),
            S('"My fear."'),
            S('"My weakness."'),
            S('"My old self."'),
            S('"There was only one thing left inside me now…"'),
            S('"Vengeance."', { pause: 1200 }),
 
            // ── Scene 6 ── The Cave Entrance (Mysterious Man)
            M('"Beyond this cave lie the Five Demon Levels."', { showImg: 'intro_cave', pause: 400 }),
            M('"Each one more dangerous than the last."'),
            M('"At the bottom…"'),
            M('"…waits the Demon King."'),
            M('"The one who murdered your family."', { pause: 1400 }),
            M('"This is where your path begins."', { hideImg: true }),
            M('"Enter the cave…"'),
            M('"And end the nightmare."', { pause: 800 }),
 
            // ── Title Card
            S('DEMON KILLER', { title: true, pause: 1800 }),
        ];
    }
 
    // ── Segment runner ─────────────────────────────────────────────────────
    _runSegment(idx) {
        if (idx >= this._script.length) {
            this._endIntro();
            return;
        }
        this._segmentIndex = idx;
        this._canAdvance = false;
        this._typing = false;
        this._typeOnDone = null;
        if (this._typeTimer) {
            this._typeTimer.remove();
            this._typeTimer = null;
        }

        const seg = this._script[idx];
 
        // Handle image show/hide
        if (seg.showImg) this._showImage(seg.showImg, !!seg.flashImg);
        if (seg.hideImg) this._hideImage();
 
        // Handle sounds
        if (seg.sound === 'heartbeat') this._playHeartbeat();
        if (seg.sound === 'thunder')   this._playThunder();
 
        // Fade in the text, type it, then allow SPACE
        this._txt.setText('');
        this.tweens.add({
            targets: this._txt,
            alpha: 1,
            duration: 350,
            onComplete: () => {
                this._segText = seg.text;
                this._typeText(seg.text, seg.title ? 40 : 28, () => {
                    this._typing = false;
                    this._typeOnDone = null;
                    this.time.delayedCall(seg.pause || 0, () => {
                        this._canAdvance = true;
                    });
                });
            }
        });
    }
 
    _typeText(fullText, fontSize, onDone) {
        this._txt.setStyle({ fontSize: fontSize + 'px' });
        this._txt.setText('');
        this._typing = true;
        this._typeOnDone = onDone;
        let i = 0;
        const interval = 38;
        if (this._typeTimer) this._typeTimer.remove();
        if (!fullText.length) {
            this._typing = false;
            if (onDone) onDone();
            return;
        }
        this._typeTimer = this.time.addEvent({
            delay: interval,
            repeat: fullText.length - 1,
            callback: () => {
                this._txt.setText(fullText.slice(0, i + 1));
                i++;
                if (i >= fullText.length) {
                    this._typing = false;
                    this._typeTimer = null;
                    if (this._typeOnDone) {
                        const done = this._typeOnDone;
                        this._typeOnDone = null;
                        done();
                    }
                }
            }
        });
    }

    _skipTyping() {
        if (!this._typing) return false;
        if (this._typeTimer) {
            this._typeTimer.remove();
            this._typeTimer = null;
        }
        this._txt.setText(this._segText);
        this._typing = false;
        if (this._typeOnDone) {
            const done = this._typeOnDone;
            this._typeOnDone = null;
            done();
        }
        return true;
    }
 
    _showImage(key, flash) {
        if (this._imgObj) { try { this._imgObj.destroy(); } catch(e){} }
        if (!this.textures.exists(key)) return;
        const W = this.scale.width, H = this.scale.height;
        const img = this.add.image(W / 2, H / 2, key).setDepth(5);
        const scale = Math.min(W / img.width, H / img.height);
        img.setScale(scale);

        if (flash) {
            img.setAlpha(1);
            const burst = this.add.rectangle(0, 0, W, H, 0xffffff, 1).setOrigin(0, 0).setDepth(6);
            this.tweens.add({
                targets: burst,
                alpha: 0,
                duration: 450,
                onComplete: () => { try { burst.destroy(); } catch (e) {} }
            });
            this.tweens.add({ targets: img, alpha: 0.9, duration: 300 });
        } else {
            img.setAlpha(0);
            this.tweens.add({ targets: img, alpha: 0.65, duration: 700 });
        }
        this._imgObj = img;
    }
    _hideImage() {
        if (!this._imgObj) return;
        const img = this._imgObj;
        this._imgObj = null;
        this.tweens.add({ targets: img, alpha: 0, duration: 500, onComplete: () => { try { img.destroy(); } catch(e){} } });
    }
 
    _resumeAudio() {
        if (this._ac && this._ac.state === 'suspended') {
            this._ac.resume().catch(() => {});
        }
    }

    _skipEntireIntro() {
        this._stopAmbient();
        if (this._typeTimer) this._typeTimer.remove();
        this.time.removeAllEvents();
        this.tweens.killAll();
        this.scene.start('StartScene');
    }

    _onAdvanceInput() {
        this._resumeAudio();
        if (this._skipTyping()) return;
        if (!this._canAdvance) return;
        this._canAdvance = false;
        this.tweens.add({
            targets: this._txt,
            alpha: 0,
            duration: 220,
            onComplete: () => { this._runSegment(this._segmentIndex + 1); }
        });
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this._skipKey)) {
            this._skipEntireIntro();
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this._spaceKey)) {
            this._onAdvanceInput();
        }
    }

    _endIntro() {
        this._stopAmbient();
        this._hideImage();
        // Fade to black, then name-entry start screen
        this.tweens.add({
            targets: this._fade,
            alpha: 1,
            duration: 1200,
            onComplete: () => { this.scene.start('StartScene'); }
        });
    }
}
 
// ═══════════════════════════════════════════════════════════════════════════
//  END SCENE
// ═══════════════════════════════════════════════════════════════════════════

class EndScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndScene' });
    }
 
    init(data) {
        this.didWin = data.win !== false;
    }
 
    preload() {
        this.load.image("end_screen", '../Background/winner_screen.jpg');
    }
 
    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
 
        if (this.didWin) {
            // Show the winner_screen image full-screen
            const bg = this.add.image(centerX, centerY, 'end_screen');
            const scaleX = this.cameras.main.width  / bg.width;
            const scaleY = this.cameras.main.height / bg.height;
            bg.setScale(Math.max(scaleX, scaleY));
 
            this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.35)
                .setOrigin(0, 0);
 
            // Cinematic ending text sequence
            this._endLines = [
                '"It\'s over…"',
                '"I finally kept my promise."',
                '"Mom…"',
                '"Dad…"',
                '"I avenged you."',
                '"You\'re at peace now."',
                '"And for the first time…"',
                '"So am I."',
                '"The end of hatred…"',
                '"…begins with one fallen demon."'
            ];
            this._lineIdx = 0;
            this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            this._skipKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
            this._canAdvance = false;

            this._endTxt = this.add.text(centerX, centerY - 60, '', {
                fontSize: '30px',
                fontFamily: 'Georgia, serif',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center',
                wordWrap: { width: this.cameras.main.width * 0.7 }
            }).setOrigin(0.5).setAlpha(0);
 
            this._showEndLine(0);
        } else {
            this.cameras.main.setBackgroundColor('#221111');
            this.add.text(centerX, centerY - 80, 'GAME OVER', {
                fontSize: '70px',
                fontFamily: 'Impact, sans-serif',
                fill: '#ff3333',
                stroke: '#000000',
                strokeThickness: 6
            }).setOrigin(0.5);
 
            const restartBtn = this.add.text(centerX, centerY + 40, 'PRESS SPACE TO RESTART', {
                fontSize: '24px',
                fontFamily: 'Arial Black, sans-serif',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
 
            this.tweens.add({ targets: restartBtn, alpha: 0.3, duration: 800, yoyo: true, loop: -1 });
 
            this.input.keyboard.once('keydown-SPACE', () => {
                currentLevel = 1;
                death = false;
                this.scene.start('StartScene');
            });
            this._skipKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        }
    }

    _showEndLine(idx) {
        if (idx >= this._endLines.length) {
            // Show restart prompt
            const cx = this.cameras.main.centerX;
            const cy = this.cameras.main.centerY;
            const btn = this.add.text(cx, cy + 80, 'PRESS SPACE TO RESTART', {
                fontSize: '22px', fontFamily: 'Arial Black', fill: '#ffffff',
                stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5).setAlpha(0);
            this.tweens.add({ targets: btn, alpha: 1, duration: 600 });
            this.tweens.add({ targets: btn, alpha: 0.3, duration: 800, yoyo: true, loop: -1, delay: 600 });
            this.input.keyboard.once('keydown-SPACE', () => {
                currentLevel = 1;
                death = false;
                this.scene.start('StartScene');
            });
            return;
        }
        this._lineIdx = idx;
        this._canAdvance = false;
        this.tweens.add({
            targets: this._endTxt,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this._endTxt.setText(this._endLines[idx]);
                this.tweens.add({
                    targets: this._endTxt,
                    alpha: 1,
                    duration: 700,
                    onComplete: () => {
                        this.time.delayedCall(600, () => { this._canAdvance = true; });
                    }
                });
            }
        });
    }
 
    _skipEntireEnd() {
        this.time.removeAllEvents();
        this.tweens.killAll();
        currentLevel = 1;
        death = false;
        this.scene.start('StartScene');
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this._skipKey)) {
            this._skipEntireEnd();
            return;
        }
        if (this._canAdvance && this._spaceKey && Phaser.Input.Keyboard.JustDown(this._spaceKey)) {
            this._canAdvance = false;
            this._showEndLine(this._lineIdx + 1);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  START SCENE
// ═══════════════════════════════════════════════════════════════════════════

class StartScene extends Phaser.Scene {
    constructor() { super({ key: 'StartScene' }); }
 
    preload() {
        this.load.image("start_bg", '../Assets/start_image.jpg');
    }
 
    create() {
        if (this.matter && this.matter.world && this.matter.world.paused) {
            this.matter.world.resume();
        }
 
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
 
        const bg = this.add.image(centerX, centerY, 'start_bg');
        const scale = Math.max(this.cameras.main.width / bg.width, this.cameras.main.height / bg.height);
        bg.setScale(scale);
 
        const titleStyle = {
            fontSize: '80px',
            fontFamily: 'Impact, sans-serif',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            shadow: { offsetX: 5, offsetY: 5, color: '#000', blur: 5, fill: true }
        };
 
        const controlStyle = {
            fontSize: '22px',
            fontFamily: 'Arial Black, Gadget, sans-serif',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        };
 
        this.add.text(centerX, centerY - 250, 'DEMON KILLER', titleStyle).setOrigin(0.5);
 
        this.add.text(centerX, centerY - 20,
            'CONTROLS\n\n' +
            'WASD: Move | Q: Dash | T: Lightning Dash\n' +
            'SPACE: Roll/Dodge | Z/X/C/V: Attacks\n' +
            'O: Kunai | I: Block | E: Interact | F: Item',
            controlStyle).setOrigin(0.5);
 
        this.add.text(centerX, centerY + 180, 'ENTER YOUR NAME:', controlStyle).setOrigin(0.5);
 
        const inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.maxLength = 20;
        inputEl.placeholder = 'SAMURAI';
        inputEl.style.cssText = `
            position:fixed;
            left:${centerX - 125}px;
            top:${centerY + 210}px;
            width:250px;
            height:40px;
            font-size:20px;
            font-family:Impact, sans-serif;
            text-align:center;
            background:#ffffff;
            color:#000000;
            border:4px solid #000000;
            border-radius:8px;
            outline:none;
            z-index:9999;
        `;
        document.body.appendChild(inputEl);
        inputEl.focus();
 
        const startHint = this.add.text(centerX, centerY + 280, '> PRESS ENTER TO START <', {
            fontSize: '32px',
            fontFamily: 'Impact',
            fill: '#FF0000',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
 
        this.tweens.add({ targets: startHint, alpha: 0.5, duration: 800, yoyo: true, repeat: -1 });
 
        let gameLaunched = false;
        const launchGame = () => {
            if (gameLaunched) return;
            gameLaunched = true;
            if (inputEl.parentNode) document.body.removeChild(inputEl);
            window.playerName = inputEl.value.trim() || 'Samurai';
            currentLevel = 1;
            death = false;
            this.scene.start('GameScene');
        };

        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                launchGame();
            }
            e.stopPropagation();
        });

        this.input.keyboard.once('keydown-ENTER', launchGame);

        this.events.on('shutdown', () => { if (inputEl.parentNode) document.body.removeChild(inputEl); });
        this.events.on('destroy',  () => { if (inputEl.parentNode) document.body.removeChild(inputEl); });
 
        startHint.setInteractive({ useHandCursor: true });
        startHint.on('pointerdown', launchGame);
    }
}
 
// ═══════════════════════════════════════════════════════════════════════════
//  GAME SCENE
// ═══════════════════════════════════════════════════════════════════════════

class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }
 
    preload() {
        this.load.image('tiles', '../Maps/mainlev_build.png');
        this.load.tilemapTiledJSON('map', '../Maps/final_game_map.tmj');
 
        this.load.image('bg1', 'Background/background1.png');
        this.load.image('bg2', 'Background/background2.png');
        this.load.image('bg3', 'Background/background3.png');
 
        this.load.audio('bgm', '../sounds/bgm.mp3');
        this.load.audio('v_attack', '../sounds/v_attack.mp3');
        this.load.audio('sfx_potion',       '../sounds/drinking_potion.mp3');
        this.load.audio('sfx_impact',       '../sounds/impact_sound.mp3');
        this.load.audio('sfx_hit_damage1',  '../sounds/sword_hit_damge_sound.mp3');
        this.load.audio('sfx_hit_damage2',  '../sounds/sword_hit_damage_sound_two.mp3');
        this.load.audio('sfx_slice1',       '../sounds/sword_slice_one.mp3');
        this.load.audio('sfx_slice2',       '../sounds/sword_slice_two.mp3');
 
        const ronin = '../Assets/Elementals_lightning_ronin_full_v1.0/Elementals_lightning_ronin_full_v1.0/animations/spritesheet/lightning_ronin_full_288x128_SpriteSheet.png';
        this.load.spritesheet('ronin', ronin, { frameWidth: 288, frameHeight: 128 });
        this.load.image('player_icon', '../Assets/Elementals_lightning_ronin_full_v1.0/Elementals_lightning_ronin_full_v1.0/lightning_ronin.png');
 
        const demonPath = '../Assets/Flying Demon 2D Pixel Art/Flying Demon 2D Pixel Art/Sprites/with_outline/';
        this.load.spritesheet('e_idle_sheet',   demonPath + 'IDLE.png',   { frameWidth: 81, frameHeight: 71 });
        this.load.spritesheet('e_attack_sheet', demonPath + 'ATTACK.png', { frameWidth: 81, frameHeight: 71 });
        this.load.spritesheet('e_death_sheet',  demonPath + 'DEATH.png',  { frameWidth: 81, frameHeight: 71 });
        this.load.spritesheet('e_flying_sheet', demonPath + 'FLYING.png', { frameWidth: 81, frameHeight: 71 });
 
        this.load.image('demon_proj', '../Assets/Flying Demon 2D Pixel Art/Flying Demon 2D Pixel Art/Sprites/projectile.png');
        this.load.image('star', '../Assets/Kunai_Pixel.png');
        this.load.image('loot_kunai', '../Assets/Kunai_Pixel.png');
 
        this.load.spritesheet('nb_sheet', '../Assets/NightBorne/NightBorne.png', { frameWidth: 80, frameHeight: 80 });
 
        const impPath = '../Assets/Imp 2D Pixel Art v1.2/Imp 2D Pixel Art v1.2/Sprites/outline/';
        this.load.spritesheet('imp_idle_sheet',   impPath + 'IDLE.png',   { frameWidth: 128, frameHeight: 48 });
        this.load.spritesheet('imp_move_sheet',   impPath + 'MOVE.png',   { frameWidth: 128, frameHeight: 48 });
        this.load.spritesheet('imp_attack_sheet', impPath + 'ATTACK.png', { frameWidth: 128, frameHeight: 48 });
        this.load.spritesheet('imp_hurt_sheet',   impPath + 'HURT.png',   { frameWidth: 128, frameHeight: 48 });
        this.load.spritesheet('imp_death_sheet',  impPath + 'DEATH.png',  { frameWidth: 128, frameHeight: 48 });
 
        const dbPath = '../Assets/Demon Boss 2D Pixel Art/Demon Boss 2D Pixel Art/Sprites/with_outline/';
        this.load.spritesheet('db_idle_sheet',       dbPath + 'IDLE.png',       { frameWidth: 162, frameHeight: 148 });
        this.load.spritesheet('db_fly_sheet',        dbPath + 'FLYING.png',     { frameWidth: 162, frameHeight: 148 });
        this.load.spritesheet('db_attack_sheet',     dbPath + 'ATTACK.png',     { frameWidth: 162, frameHeight: 148 });
        this.load.spritesheet('db_hurt_sheet',       dbPath + 'HURT.png',       { frameWidth: 162, frameHeight: 148 });
        this.load.spritesheet('db_death_sheet',      dbPath + 'DEATH.png',      { frameWidth: 162, frameHeight: 148 });
        this.load.spritesheet('db_transition_sheet', dbPath + 'TRANSITION.png', { frameWidth: 162, frameHeight: 148 });
 
        const dsPath = '../Assets/Demon Samurai 2D Pixel Art/Demon Samurai 2D Pixel Art/Demon Samurai 2D Pixel Art/Sprites/';
        this.load.spritesheet('ds_idle_sheet',    dsPath + 'IDLE.png',                     { frameWidth: 128, frameHeight: 108 });
        this.load.spritesheet('ds_run_sheet',     dsPath + 'RUN.png',                      { frameWidth: 128, frameHeight: 108 });
        this.load.spritesheet('ds_hurt_sheet',    dsPath + 'HURT.png',                     { frameWidth: 128, frameHeight: 108 });
        this.load.spritesheet('ds_death_sheet',   dsPath + 'DEATH.png',                    { frameWidth: 128, frameHeight: 108 });
        this.load.spritesheet('ds_defend_sheet',  dsPath + 'DEFEND.png',                   { frameWidth: 128, frameHeight: 108 });
        this.load.spritesheet('ds_shout_sheet',   dsPath + 'SHOUT.png',                    { frameWidth: 128, frameHeight: 108 });
        this.load.spritesheet('ds_atk1_sheet',    dsPath + 'ATTACK 1.png',                 { frameWidth: 128, frameHeight: 108 });
        this.load.spritesheet('ds_atk2_sheet',    dsPath + 'ATTACK 2.png',                 { frameWidth: 128, frameHeight: 108 });
        this.load.spritesheet('ds_atk3_sheet',    dsPath + 'ATTACK 3.png',                 { frameWidth: 128, frameHeight: 108 });
        this.load.spritesheet('ds_jumpatk_sheet', dsPath + 'JUMP ATTACK.png',              { frameWidth: 128, frameHeight: 108 });
        this.load.spritesheet('dsf_idle_sheet',    dsPath + 'IDLE (FLAMING SWORD).png',    { frameWidth: 128, frameHeight: 108 });
        this.load.spritesheet('dsf_run_sheet',     dsPath + 'RUN (FLAMING SWORD).png',     { frameWidth: 128, frameHeight: 108 });
        this.load.spritesheet('dsf_hurt_sheet',    dsPath + 'HURT (FLAMING SWORD).png',    { frameWidth: 128, frameHeight: 108 });
        this.load.spritesheet('dsf_atk1_sheet',    dsPath + 'ATTACK 1 (FLAMING SWORD).png',{ frameWidth: 128, frameHeight: 108 });
        this.load.spritesheet('dsf_atk2_sheet',    dsPath + 'ATTACK 2 (FLAMING SWORD).png',{ frameWidth: 128, frameHeight: 108 });
        this.load.spritesheet('dsf_atk3_sheet',    dsPath + 'ATTACK 3 (FLAMING SWORD).png',{ frameWidth: 128, frameHeight: 108 });
        this.load.spritesheet('dsf_jumpatk_sheet', dsPath + 'JUMP ATTACK (FLAMING SWORD).png',{ frameWidth: 128, frameHeight: 108 });
 
        this.load.image('lightning_elemental_icon', '../Assets/Elementals_lightning_ronin_full_v1.0/Elementals_lightning_ronin_full_v1.0/lightning_elemental.png');
 
        const deathCenBase = '../Assets/Elementals_lightning_ronin_full_v1.0/Elementals_lightning_ronin_full_v1.0/animations/PNG/death_cen/';
        for (let i = 1; i <= 20; i++) this.load.image(`u1_death_cen_${i}`, deathCenBase + `death_cen_${i}.png`);
 
        const elBase = '../Assets/Elementals_lightning_ronin_full_v1.0/Elementals_lightning_ronin_full_v1.0/animations/PNG/';
        const elAnims = [
            { key: 'e_idle', folder: 'e_idle', count: 9 }, { key: 'e_run', folder: 'e_run', count: 8 },
            { key: 'e_1_atk', folder: 'e_1_atk', count: 7 }, { key: 'e_2_atk', folder: 'e_2_atk', count: 8 },
            { key: 'e_3_atk', folder: 'e_3_atk', count: 21 }, { key: 'e_air_atk', folder: 'e_air_atk', count: 8 },
            { key: 'e_sp_atk', folder: 'e_sp_atk', count: 20 }, { key: 'e_defend', folder: 'e_defend', count: 8 },
            { key: 'e_take_hit', folder: 'e_take_hit', count: 6 }, { key: 'e_j_up', folder: 'e_jump_up', count: 3 },
            { key: 'e_j_down', folder: 'e_jump_down', count: 3 }, { key: 'back2human', folder: 'back2human', count: 12 },
        ];
        for (const { key, folder, count } of elAnims)
            for (let i = 1; i <= count; i++) this.load.image(`${key}_${i}`, `${elBase}${folder}/${folder}_${i}.png`);
 
        this.load.image('ally_icon', '../Assets/elementals_wind_hashashin_FREE_v1.1/elementals_wind_hashashin_FREE_v1.1/wind_hashashin.png');
        this.load.image('fk_icon',   '../Assets/Elementals_fire_knight_FREE_v1.1/Elementals_fire_knight_FREE_v1.1/fire_knight.png');
        this.load.image('wk_icon',   '../Assets/Elementals_water_priestess_FREE_v1.1/Elementals_water_priestess_FREE_v1.1/water_priestess.png');
        this.load.image('gm_icon',   '../Assets/Elementals_ground_monk_FREE_v1.3.1/Elementals_ground_monk_FREE_v1.3/ground_monk.png');
        this.load.image('mb_icon',   '../Assets/Elementals_metal_bladekeeper_FREE_v1.1/Elementals_metal_bladekeeper_FREE_v1.1/metal_bladekeeper.png');
        this.load.image('ss_icon',   '../Assets/Elementals_shadow_stalker_complete_v1.0/Elementals_shadow_stalker_complete_v1.0/shadow_stalker.png');
        this.load.image('ss_e_icon', '../Assets/Elementals_shadow_stalker_complete_v1.0/Elementals_shadow_stalker_complete_v1.0/shadow_elemental.png');

        const whBase = '../Assets/elementals_wind_hashashin_FREE_v1.1/elementals_wind_hashashin_FREE_v1.1/PNG/';
        const whAnims = [
            { key: 'wh_idle', folder: 'idle', count: 8 }, { key: 'wh_run', folder: 'run', count: 8 },
            { key: 'wh_atk1', folder: '1_atk', count: 8 }, { key: 'wh_atk2', folder: '2_atk', count: 18 },
            { key: 'wh_atk3', folder: '3_atk', count: 26 }, { key: 'wh_sp_atk', folder: 'sp_atk', count: 30 },
            { key: 'wh_j_up', folder: 'j_up', count: 3 }, { key: 'wh_j_down', folder: 'j_down', count: 3 },
            { key: 'wh_air', folder: 'air_atk', count: 7 }, { key: 'wh_defend', folder: 'defend', count: 8 },
            { key: 'wh_hurt', folder: 'take_hit', count: 6 }, { key: 'wh_death', folder: 'death', count: 19 },
            { key: 'wh_roll', folder: 'roll', count: 6 },
        ];
        for (const { key, folder, count } of whAnims)
            for (let i = 1; i <= count; i++) this.load.image(`${key}_${i}`, `${whBase}${folder}/${folder}_${i}.png`);
 
        const fkBase = '../Assets/Elementals_fire_knight_FREE_v1.1/Elementals_fire_knight_FREE_v1.1/png/fire_knight/';
        const fkAnims = [
            { key: 'fk_idle', folder: '01_idle', prefix: 'idle', count: 8 }, { key: 'fk_run', folder: '02_run', prefix: 'run', count: 8 },
            { key: 'fk_jump', folder: '03_jump', prefix: 'jump', count: 20 }, { key: 'fk_roll', folder: '04_roll', prefix: 'roll', count: 8 },
            { key: 'fk_atk1', folder: '05_1_atk', prefix: '1_atk', count: 11 }, { key: 'fk_atk2', folder: '06_2_atk', prefix: '2_atk', count: 19 },
            { key: 'fk_atk3', folder: '07_3_atk', prefix: '3_atk', count: 28 }, { key: 'fk_sp_atk', folder: '08_sp_atk', prefix: 'sp_atk', count: 18 },
            { key: 'fk_defend', folder: '09_defend', prefix: 'defend', count: 10 }, { key: 'fk_hurt', folder: '10_take_hit', prefix: 'take_hit', count: 6 },
            { key: 'fk_death', folder: '11_death', prefix: 'death', count: 13 }, { key: 'fk_air', folder: 'air_atk', prefix: 'air_atk', count: 8 },
        ];
        for (const { key, folder, prefix, count } of fkAnims)
            for (let i = 1; i <= count; i++) this.load.image(`${key}_${i}`, `${fkBase}${folder}/${prefix}_${i}.png`);
 
        const wkBase = '../Assets/Elementals_water_priestess_FREE_v1.1/Elementals_water_priestess_FREE_v1.1/png/';
        const wkAnims = [
            { key: 'wk_idle', folder: '01_idle', prefix: 'idle', count: 8 }, { key: 'wk_walk', folder: '02_walk', prefix: 'walk', count: 10 },
            { key: 'wk_run', folder: '03_surf', prefix: 'surf', count: 8 }, { key: 'wk_j_up', folder: '04_j_up', prefix: 'j_up', count: 3 },
            { key: 'wk_j_down', folder: '05_j_down', prefix: 'j_down', count: 3 }, { key: 'wk_roll', folder: '06_tumble', prefix: 'tumble', count: 6 },
            { key: 'wk_atk1', folder: '07_1_atk', prefix: '1_atk', count: 7 }, { key: 'wk_atk2', folder: '08_2_atk', prefix: '2_atk', count: 21 },
            { key: 'wk_atk3', folder: '09_3_atk', prefix: '3_atk', count: 27 }, { key: 'wk_sp_atk', folder: '10_sp_atk', prefix: 'sp_atk', count: 32 },
            { key: 'wk_heal', folder: '11_heal', prefix: 'heal', count: 12 }, { key: 'wk_defend', folder: '12_defend', prefix: 'defend', count: 12 },
            { key: 'wk_hurt', folder: '13_take_hit', prefix: 'take_hit', count: 7 }, { key: 'wk_death', folder: '14_death', prefix: 'death', count: 16 },
            { key: 'wk_air', folder: 'air_atk', prefix: 'air_atk', count: 8 },
        ];
        for (const { key, folder, prefix, count } of wkAnims)
            for (let i = 1; i <= count; i++) this.load.image(`${key}_${i}`, `${wkBase}${folder}/${prefix}_${i}.png`);
 
        const gmBase = '../Assets/Elementals_ground_monk_FREE_v1.3.1/Elementals_ground_monk_FREE_v1.3/png/';
        const gmAnims = [
            { key: 'gm_idle', folder: 'idle', prefix: 'idle', count: 6 }, { key: 'gm_run', folder: 'run', prefix: 'run', count: 8 },
            { key: 'gm_j_up', folder: 'j_up', prefix: 'j_up', count: 3 }, { key: 'gm_j_down', folder: 'j_down', prefix: 'j_down', count: 3 },
            { key: 'gm_roll', folder: 'roll', prefix: 'roll', count: 6 }, { key: 'gm_atk1', folder: '1_atk', prefix: '1_atk', count: 6 },
            { key: 'gm_atk2', folder: '2_atk', prefix: '2_atk', count: 12 }, { key: 'gm_atk3', folder: '3_atk', prefix: '3_atk', count: 23 },
            { key: 'gm_sp_atk', folder: 'sp_atk', prefix: 'sp_atk', count: 25 }, { key: 'gm_air', folder: 'air_atk', prefix: 'air_atk', count: 7 },
            { key: 'gm_defend', folder: 'defend', prefix: 'defend', count: 13 }, { key: 'gm_death', folder: 'death', prefix: 'death', count: 18 },
            { key: 'gm_med', folder: 'meditate', prefix: 'meditate', count: 16 }, { key: 'gm_hurt', folder: 'take_hit', prefix: 'take_hit', count: 6 },
        ];
        for (const { key, folder, prefix, count } of gmAnims)
            for (let i = 1; i <= count; i++) this.load.image(`${key}_${i}`, `${gmBase}${folder}/${prefix}_${i}.png`);
 
        const mbBase = '../Assets/Elementals_metal_bladekeeper_FREE_v1.1/Elementals_metal_bladekeeper_FREE_v1.1/PNG animations/';
        const mbAnims = [
            { key: 'mb_idle', folder: '01_idle', prefix: '01_idle', count: 8 }, { key: 'mb_run', folder: '02_run', prefix: '02_run', count: 8 },
            { key: 'mb_j_up', folder: '03_jump_up', prefix: '03_jump_up', count: 3 }, { key: 'mb_j_down', folder: '03_jump_down', prefix: '03_jump_down', count: 3 },
            { key: 'mb_jump', folder: '03_jump_full', prefix: '03_jump', count: 20 }, { key: 'mb_atk1', folder: '07_1_atk', prefix: '07_1_atk', count: 6 },
            { key: 'mb_atk2', folder: '08_2_atk', prefix: '08_2_atk', count: 8 }, { key: 'mb_atk3', folder: '09_3_atk', prefix: '09_3_atk', count: 18 },
            { key: 'mb_sp_atk', folder: '10_sp_atk', prefix: '10_sp_atk', count: 11 }, { key: 'mb_defend', folder: '11_defend', prefix: '11_defend', count: 12 },
            { key: 'mb_hurt', folder: '12_take_hit', prefix: '12_take_hit', count: 6 }, { key: 'mb_death', folder: '13_death', prefix: '13_death', count: 12 },
        ];
        for (const { key, folder, prefix, count } of mbAnims)
            for (let i = 1; i <= count; i++) this.load.image(`${key}_${i}`, `${mbBase}${folder}/${prefix}_${i}.png`);
        this.load.image('mb_air_1', `${mbBase}air_atk/air_atk8.png`);

        // ── Upper 3 (Boss Demon Slime) ────────────────────────────────────────
        const ds3Base = '../Assets/boss_demon_slime_FREE_v1.0/boss_demon_slime_FREE_v1.0/individual sprites/';
        const ds3Anims = [
            { key: 'ds3_idle',     folder: '01_demon_idle',     prefix: 'demon_idle',     count: 6  },
            { key: 'ds3_walk',     folder: '02_demon_walk',     prefix: 'demon_walk',     count: 12 },
            { key: 'ds3_cleave',   folder: '03_demon_cleave',   prefix: 'demon_cleave',   count: 15 },
            { key: 'ds3_take_hit', folder: '04_demon_take_hit', prefix: 'demon_take_hit', count: 5  },
            { key: 'ds3_death',    folder: '05_demon_death',    prefix: 'demon_death',    count: 22 },
        ];
        for (const { key, folder, prefix, count } of ds3Anims) {
            for (let i = 1; i <= count; i++) {
                this.load.image(`${key}_${i}`, `${ds3Base}${folder}/${prefix}_${i}.png`);
            }
        }

       const ssBase = '../Assets/Elementals_shadow_stalker_complete_v1.0/Elementals_shadow_stalker_complete_v1.0/animations/PNG/';
       const ssAnims = [
           { key: 'ss_idle',     folder: 'idle',     count: 12 },
           { key: 'ss_run',      folder: 'run',      count: 10 },
           { key: 'ss_jump',     folder: 'jump',     count: 13 },
           { key: 'ss_1_atk',    folder: '1_atk',    count: 9  },
           { key: 'ss_2_atk',    folder: '2_atk',    count: 17 },
           { key: 'ss_3_atk',    folder: '3_atk',    count: 23 },
           { key: 'ss_air_atk',  folder: 'air_atk',  count: 8  },
           { key: 'ss_sp_atk',   folder: 'sp_atk',   count: 34 },
           { key: 'ss_defend',   folder: 'defend',   count: 7  },
           { key: 'ss_e_idle',   folder: 'e_idle',   count: 18 },
           { key: 'ss_e_run',    folder: 'e_run',    count: 10 },
           { key: 'ss_e_jump',   folder: 'e_jump',   count: 15 },
           { key: 'ss_e_1_atk',  folder: 'e_1_atk',  count: 14 },
           { key: 'ss_e_2_atk',  folder: 'e_2_atk',  count: 22 },
           { key: 'ss_e_3_atk',  folder: 'e_3_atk',  count: 35 },
           { key: 'ss_e_air',    folder: 'e_air_atk', count: 8  },
           { key: 'ss_e_sp',     folder: 'e_sp_atk',  count: 19 },
           { key: 'ss_e_defend', folder: 'e_defend',  count: 6  },
           { key: 'ss_transform',  folder: 'transform',  count: 37 },
           { key: 'ss_back2human', folder: 'back2human', count: 14 },
           { key: 'ss_death',      folder: 'death',      count: 12 },
       ];
       for (const { key, folder, count } of ssAnims) {
           for (let i = 1; i <= count; i++) {
               this.load.image(`${key}_${i}`, `${ssBase}${folder}/${folder}_${i}.png`);
           }
       }
    }

    create() {
        gameSceneRef = this;
        const scene = this;
        isGameOver = false;
        gameOverContainer = null;
        gameOverTextObj = null;
        gameOverRectObj = null;
        cooldowns = { z: 0, x: 0, c: 0 };
        kunaiCount = KUNAI_START;
        potionCount = POTION_START;
        ultimateCharge = 0;
        bossDropSpawned = false;
        this._winEndScheduled = false;
        const K = Phaser.Input.Keyboard.KeyCodes;
 
        this.keys = {
            w: this.input.keyboard.addKey(K.W), a: this.input.keyboard.addKey(K.A),
            s: this.input.keyboard.addKey(K.S), d: this.input.keyboard.addKey(K.D),
            q: this.input.keyboard.addKey(K.Q), t: this.input.keyboard.addKey(K.T),
            z: this.input.keyboard.addKey(K.Z), x: this.input.keyboard.addKey(K.X),
            c: this.input.keyboard.addKey(K.C), v: this.input.keyboard.addKey(K.V),
            o: this.input.keyboard.addKey(K.O), i: this.input.keyboard.addKey(K.I),
            f: this.input.keyboard.addKey(K.F)
        };
 
        cursors = this.input.keyboard.createCursorKeys();
        enterKey = this.input.keyboard.addKey(K.E);
        spaceKey = this.input.keyboard.addKey(K.SPACE);
        pointer = this.input.activePointer;
 
        const map = this.make.tilemap({ key: 'map' });
        const tileset = map.addTilesetImage('tileSet', 'tiles');
        const zoom = (window.innerWidth / (map.widthInPixels - 150)) * 2;
        this.cameras.main.setZoom(zoom);
 
        const bg1 = this.add.image(0, 0, 'bg1').setOrigin(0).setScrollFactor(0);
        const bg2 = this.add.image(0, 0, 'bg2').setOrigin(0).setScrollFactor(0.2);
        const bg3 = this.add.image(0, 0, 'bg3').setOrigin(0).setScrollFactor(0.4);
        bg1.setDisplaySize(window.innerWidth, window.innerHeight);
        bg2.setDisplaySize(map.widthInPixels, map.heightInPixels);
        bg3.setDisplaySize(map.widthInPixels, map.heightInPixels);
 
        const layer1 = map.createLayer('layer1', tileset, 0, 0);
        const layer2 = map.createLayer('layer2', tileset, 0, 0);
        layer1.setCollisionByExclusion([-1]);
        this.matter.world.convertTilemapLayer(layer1);
        initStaticMatterFlags(this);
 
        const R = 44;
        const row = (r, count) => ({ start: r * R, end: r * R + count - 1 });
 
        this.anims.create({ key: 'idle_anim',    frames: this.anims.generateFrameNumbers('ronin', row(0, 10)), frameRate: 8,  repeat: -1 });
        this.anims.create({ key: 'run_anim',     frames: this.anims.generateFrameNumbers('ronin', row(1, 8)),  frameRate: 15, repeat: -1 });
        this.anims.create({ key: 'jump_anim',    frames: this.anims.generateFrameNumbers('ronin', row(4, 8)),  frameRate: 12, repeat: 0  });
        this.anims.create({ key: 'air_atk_anim', frames: this.anims.generateFrameNumbers('ronin', row(5, 8)),  frameRate: 16, repeat: 0  });
        this.anims.create({ key: 'roll_anim',    frames: this.anims.generateFrameNumbers('ronin', row(6, 8)),  frameRate: 18, repeat: 0  });
        this.anims.create({ key: 'dash_anim',    frames: this.anims.generateFrameNumbers('ronin', row(7, 8)),  frameRate: 15, repeat: 0  });
        this.anims.create({ key: 'ldash_anim',   frames: this.anims.generateFrameNumbers('ronin', row(8, 8)),  frameRate: 15, repeat: 0  });
        this.anims.create({ key: 'atk1_anim',    frames: this.anims.generateFrameNumbers('ronin', row(9, 8)),  frameRate: 18, repeat: 0  });
        this.anims.create({ key: 'atk2_anim',    frames: this.anims.generateFrameNumbers('ronin', row(10, 8)), frameRate: 18, repeat: 0  });
        this.anims.create({ key: 'atk3_anim',    frames: this.anims.generateFrameNumbers('ronin', { start: 11 * R, end: 11 * R + 17 }), frameRate: 7, repeat: 0 });
        this.anims.create({ key: 'ult_anim',     frames: this.anims.generateFrameNumbers('ronin', row(12, 12)), frameRate: 7, repeat: 0  });
        this.anims.create({ key: 'block_anim',   frames: this.anims.generateFrameNumbers('ronin', row(13, 6)),  frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'hurt_anim',    frames: this.anims.generateFrameNumbers('ronin', row(14, 6)),  frameRate: 12, repeat: 0  });
        this.anims.create({ key: 'death_anim',   frames: this.anims.generateFrameNumbers('ronin', row(15, 12)), frameRate: 10, repeat: 0  });
 
        this.anims.create({ key: 'e_idle',   frames: this.anims.generateFrameNumbers('e_idle_sheet',   { start: 0, end: -1 }), frameRate: 8,  repeat: -1 });
        this.anims.create({ key: 'e_attack', frames: this.anims.generateFrameNumbers('e_attack_sheet', { start: 0, end: -1 }), frameRate: 12, repeat: -1 });
        this.anims.create({ key: 'e_death',  frames: this.anims.generateFrameNumbers('e_death_sheet',  { start: 0, end: -1 }), frameRate: 10, repeat: 0  });
        this.anims.create({ key: 'e_spawn',  frames: this.anims.generateFrameNumbers('e_flying_sheet', { start: 0, end: -1 }), frameRate: 10, repeat: 0  });
 
        const NB_COLS = 23;
        const nbRow = (r, count) => ({ start: r * NB_COLS, end: r * NB_COLS + count - 1 });
        this.anims.create({ key: 'nb_idle',   frames: this.anims.generateFrameNumbers('nb_sheet', nbRow(0, 8)),  frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'nb_run',    frames: this.anims.generateFrameNumbers('nb_sheet', nbRow(1, 8)),  frameRate: 16, repeat: -1 });
        this.anims.create({ key: 'nb_attack', frames: this.anims.generateFrameNumbers('nb_sheet', nbRow(2, 12)), frameRate: 18, repeat: 0  });
        this.anims.create({ key: 'nb_hurt',   frames: this.anims.generateFrameNumbers('nb_sheet', nbRow(3, 4)),  frameRate: 14, repeat: 0  });
        this.anims.create({ key: 'nb_death',  frames: this.anims.generateFrameNumbers('nb_sheet', nbRow(4, 12)), frameRate: 12, repeat: 0  });
 
        this.anims.create({ key: 'imp_idle',   frames: this.anims.generateFrameNumbers('imp_idle_sheet',   { start: 0, end: 6 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'imp_move',   frames: this.anims.generateFrameNumbers('imp_move_sheet',   { start: 0, end: 6 }), frameRate: 14, repeat: -1 });
        this.anims.create({ key: 'imp_attack', frames: this.anims.generateFrameNumbers('imp_attack_sheet', { start: 0, end: 8 }), frameRate: 16, repeat: 0  });
        this.anims.create({ key: 'imp_hurt',   frames: this.anims.generateFrameNumbers('imp_hurt_sheet',   { start: 0, end: 5 }), frameRate: 12, repeat: 0  });
        this.anims.create({ key: 'imp_death',  frames: this.anims.generateFrameNumbers('imp_death_sheet',  { start: 0, end: 7 }), frameRate: 10, repeat: 0  });
 
        this.anims.create({ key: 'db_idle',       frames: this.anims.generateFrameNumbers('db_idle_sheet',       { start: 0, end: -1 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'db_fly',        frames: this.anims.generateFrameNumbers('db_fly_sheet',        { start: 0, end: -1 }), frameRate: 12, repeat: -1 });
        this.anims.create({ key: 'db_attack',     frames: this.anims.generateFrameNumbers('db_attack_sheet',     { start: 0, end: -1 }), frameRate: 8,  repeat: 0  });
        this.anims.create({ key: 'db_hurt',       frames: this.anims.generateFrameNumbers('db_hurt_sheet',       { start: 0, end: -1 }), frameRate: 12, repeat: 0  });
        this.anims.create({ key: 'db_death',      frames: this.anims.generateFrameNumbers('db_death_sheet',      { start: 0, end: -1 }), frameRate: 10, repeat: 0  });
        this.anims.create({ key: 'db_transition', frames: this.anims.generateFrameNumbers('db_transition_sheet', { start: 0, end: -1 }), frameRate: 12, repeat: 0  });
 
        this.anims.create({ key: 'ds_idle',    frames: this.anims.generateFrameNumbers('ds_idle_sheet',    { start: 0, end: -1 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'ds_run',     frames: this.anims.generateFrameNumbers('ds_run_sheet',     { start: 0, end: -1 }), frameRate: 14, repeat: -1 });
        this.anims.create({ key: 'ds_hurt',    frames: this.anims.generateFrameNumbers('ds_hurt_sheet',    { start: 0, end: -1 }), frameRate: 12, repeat: 0  });
        this.anims.create({ key: 'ds_death',   frames: this.anims.generateFrameNumbers('ds_death_sheet',   { start: 0, end: -1 }), frameRate: 10, repeat: 0  });
        this.anims.create({ key: 'ds_defend',  frames: this.anims.generateFrameNumbers('ds_defend_sheet',  { start: 0, end: -1 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'ds_shout',   frames: this.anims.generateFrameNumbers('ds_shout_sheet',   { start: 0, end: -1 }), frameRate: 12, repeat: 0  });
        this.anims.create({ key: 'ds_atk1',    frames: this.anims.generateFrameNumbers('ds_atk1_sheet',    { start: 0, end: -1 }), frameRate: 16, repeat: 0  });
        this.anims.create({ key: 'ds_atk2',    frames: this.anims.generateFrameNumbers('ds_atk2_sheet',    { start: 0, end: -1 }), frameRate: 16, repeat: 0  });
        this.anims.create({ key: 'ds_atk3',    frames: this.anims.generateFrameNumbers('ds_atk3_sheet',    { start: 0, end: -1 }), frameRate: 16, repeat: 0  });
        this.anims.create({ key: 'ds_jumpatk', frames: this.anims.generateFrameNumbers('ds_jumpatk_sheet', { start: 0, end: -1 }), frameRate: 16, repeat: 0  });
        this.anims.create({ key: 'dsf_idle',    frames: this.anims.generateFrameNumbers('dsf_idle_sheet',    { start: 0, end: -1 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'dsf_run',     frames: this.anims.generateFrameNumbers('dsf_run_sheet',     { start: 0, end: -1 }), frameRate: 14, repeat: -1 });
        this.anims.create({ key: 'dsf_hurt',    frames: this.anims.generateFrameNumbers('dsf_hurt_sheet',    { start: 0, end: -1 }), frameRate: 12, repeat: 0  });
        this.anims.create({ key: 'dsf_atk1',    frames: this.anims.generateFrameNumbers('dsf_atk1_sheet',    { start: 0, end: -1 }), frameRate: 16, repeat: 0  });
        this.anims.create({ key: 'dsf_atk2',    frames: this.anims.generateFrameNumbers('dsf_atk2_sheet',    { start: 0, end: -1 }), frameRate: 16, repeat: 0  });
        this.anims.create({ key: 'dsf_atk3',    frames: this.anims.generateFrameNumbers('dsf_atk3_sheet',    { start: 0, end: -1 }), frameRate: 16, repeat: 0  });
        this.anims.create({ key: 'dsf_jumpatk', frames: this.anims.generateFrameNumbers('dsf_jumpatk_sheet', { start: 0, end: -1 }), frameRate: 16, repeat: 0  });
 
        this.anims.create({
            key: 'u1_death_cen',
            frames: Array.from({ length: 20 }, (_, idx) => ({ key: `u1_death_cen_${idx + 1}` })),
            frameRate: 16, repeat: 0
        });
 
        const mkAnim = (key, folder, count, fps, loop) => {
            this.anims.create({
                key,
                frames: Array.from({ length: count }, (_, i) => ({ key: `${folder}_${i + 1}` })),
                frameRate: fps, repeat: loop ? -1 : 0
            });
        };
        mkAnim('el_idle','e_idle',9,8,true); mkAnim('el_run','e_run',8,15,true);
        mkAnim('el_atk1','e_1_atk',7,18,false); mkAnim('el_atk2','e_2_atk',8,18,false);
        mkAnim('el_atk3','e_3_atk',21,14,false); mkAnim('el_air_atk','e_air_atk',8,18,false);
        mkAnim('el_sp_atk','e_sp_atk',20,14,false); mkAnim('el_defend','e_defend',8,12,true);
        mkAnim('el_hurt','e_take_hit',6,14,false); mkAnim('el_j_up','e_j_up',3,12,false);
        mkAnim('el_j_down','e_j_down',3,12,false); mkAnim('el_back2human','back2human',12,14,false);
 
        mkAnim('wh_idle','wh_idle',8,8,true); mkAnim('wh_run','wh_run',8,15,true);
        mkAnim('wh_atk1','wh_atk1',8,18,false); mkAnim('wh_atk2','wh_atk2',18,18,false);
        mkAnim('wh_atk3','wh_atk3',26,14,false); mkAnim('wh_sp_atk','wh_sp_atk',30,14,false);
        mkAnim('wh_j_up','wh_j_up',3,12,false); mkAnim('wh_j_down','wh_j_down',3,12,false);
        mkAnim('wh_air','wh_air',7,18,false); mkAnim('wh_defend','wh_defend',8,10,true);
        mkAnim('wh_hurt','wh_hurt',6,14,false); mkAnim('wh_death','wh_death',19,10,false);
        mkAnim('wh_roll','wh_roll',6,18,false);
 
        mkAnim('fk_idle','fk_idle',8,8,true); mkAnim('fk_run','fk_run',8,15,true);
        mkAnim('fk_jump','fk_jump',20,14,false); mkAnim('fk_roll','fk_roll',8,18,false);
        mkAnim('fk_atk1','fk_atk1',11,18,false); mkAnim('fk_atk2','fk_atk2',19,18,false);
        mkAnim('fk_atk3','fk_atk3',28,14,false); mkAnim('fk_sp_atk','fk_sp_atk',18,14,false);
        mkAnim('fk_defend','fk_defend',10,10,true); mkAnim('fk_hurt','fk_hurt',6,14,false);
        mkAnim('fk_death','fk_death',13,10,false); mkAnim('fk_air','fk_air',8,18,false);
 
        mkAnim('wk_idle','wk_idle',8,8,true); mkAnim('wk_walk','wk_walk',10,10,true);
        mkAnim('wk_run','wk_run',8,15,true); mkAnim('wk_j_up','wk_j_up',3,12,false);
        mkAnim('wk_j_down','wk_j_down',3,12,false); mkAnim('wk_roll','wk_roll',6,18,false);
        mkAnim('wk_atk1','wk_atk1',7,18,false); mkAnim('wk_atk2','wk_atk2',21,18,false);
        mkAnim('wk_atk3','wk_atk3',27,14,false); mkAnim('wk_sp_atk','wk_sp_atk',32,14,false);
        mkAnim('wk_defend','wk_defend',12,10,true); mkAnim('wk_hurt','wk_hurt',7,14,false);
        mkAnim('wk_death','wk_death',16,10,false); mkAnim('wk_air','wk_air',8,18,false);
        mkAnim('wk_heal','wk_heal',12,10,false);
 
        mkAnim('gm_idle','gm_idle',6,8,true); mkAnim('gm_run','gm_run',8,15,true);
        mkAnim('gm_j_up','gm_j_up',3,12,false); mkAnim('gm_j_down','gm_j_down',3,12,false);
        mkAnim('gm_roll','gm_roll',6,18,false); mkAnim('gm_atk1','gm_atk1',6,18,false);
        mkAnim('gm_atk2','gm_atk2',12,18,false); mkAnim('gm_atk3','gm_atk3',23,14,false);
        mkAnim('gm_sp_atk','gm_sp_atk',25,14,false); mkAnim('gm_air','gm_air',7,18,false);
        mkAnim('gm_defend','gm_defend',13,10,true); mkAnim('gm_death','gm_death',18,10,false);
        mkAnim('gm_med','gm_med',16,10,true); mkAnim('gm_hurt','gm_hurt',6,14,false);
 
        mkAnim('mb_idle','mb_idle',8,8,true); mkAnim('mb_run','mb_run',8,15,true);
        mkAnim('mb_j_up','mb_j_up',3,12,false); mkAnim('mb_j_down','mb_j_down',3,12,false);
        mkAnim('mb_jump','mb_jump',20,14,false); mkAnim('mb_atk1','mb_atk1',6,18,false);
        mkAnim('mb_atk2','mb_atk2',8,18,false); mkAnim('mb_atk3','mb_atk3',18,14,false);
        mkAnim('mb_sp_atk','mb_sp_atk',11,14,false); mkAnim('mb_defend','mb_defend',12,10,true);
        mkAnim('mb_hurt','mb_hurt',6,14,false); mkAnim('mb_death','mb_death',12,10,false);
        mkAnim('mb_air','mb_air',1,8,false);

        // Upper 3 — Boss Demon Slime
        mkAnim('ds3_idle',     'ds3_idle',     6,  8,  true);
        mkAnim('ds3_walk',     'ds3_walk',     12, 10, true);
        mkAnim('ds3_cleave',   'ds3_cleave',   15, 16, false);
        mkAnim('ds3_take_hit', 'ds3_take_hit', 5,  12, false);
        mkAnim('ds3_death',    'ds3_death',    22, 10, false);

        // Shadow Stalker animations
        const mkSsAnim = (key, folder, count, fps, loop) => {
            this.anims.create({ key, frames: Array.from({ length: count }, (_, i) => ({ key: `${folder}_${i + 1}` })), frameRate: fps, repeat: loop ? -1 : 0 });
        };
        mkSsAnim('ss_idle',     'ss_idle',     12, 8,  true);
        mkSsAnim('ss_run',      'ss_run',      10, 15, true);
        mkSsAnim('ss_jump',     'ss_jump',     13, 12, false);
        mkSsAnim('ss_1_atk',    'ss_1_atk',    9,  18, false);
        mkSsAnim('ss_2_atk',    'ss_2_atk',    17, 18, false);
        mkSsAnim('ss_3_atk',    'ss_3_atk',    23, 14, false);
        mkSsAnim('ss_air_atk',  'ss_air_atk',  8,  18, false);
        mkSsAnim('ss_sp_atk',   'ss_sp_atk',   34, 14, false);
        mkSsAnim('ss_defend',   'ss_defend',   7,  12, true);
        mkSsAnim('ss_e_idle',   'ss_e_idle',   18, 8,  true);
        mkSsAnim('ss_e_run',    'ss_e_run',    10, 15, true);
        mkSsAnim('ss_e_jump',   'ss_e_jump',   15, 12, false);
        mkSsAnim('ss_e_1_atk',  'ss_e_1_atk',  14, 18, false);
        mkSsAnim('ss_e_2_atk',  'ss_e_2_atk',  22, 18, false);
        mkSsAnim('ss_e_3_atk',  'ss_e_3_atk',  35, 14, false);
        mkSsAnim('ss_e_air',    'ss_e_air',    8,  18, false);
        mkSsAnim('ss_e_sp',     'ss_e_sp',     19, 14, false);
        mkSsAnim('ss_e_defend', 'ss_e_defend', 6,  12, true);
        mkSsAnim('ss_transform',  'ss_transform',  37, 14, false);
        mkSsAnim('ss_back2human', 'ss_back2human', 14, 14, false);
        mkSsAnim('ss_death',     'ss_death',      12, 10, false);
        playerHp = PLAYER_MAX_HP;
        airJumpsUsed = 0;
        doubleJumpReady = true;
        wasGrounded = true;
        playerGroundContacts = 0;
        player = this.matter.add.sprite(43, 200, 'ronin');
        player.setBody({ type: 'rectangle', width: 20, height: 40 });
        player.setMass(2);
        player.setFriction(0.05);
        player.setFixedRotation();
        player.setDepth(10);
        player._rollDir = 0;
        player.setDisplayOrigin(144, 100);
 
        applyPlayerMatterFilter(playerMaskAll());
        player.play('idle_anim');
 
        const unlockAnims = ['atk1_anim', 'atk2_anim', 'atk3_anim', 'ult_anim', 'roll_anim', 'dash_anim', 'ldash_anim', 'air_atk_anim'];
        player.on('animationcomplete', (anim) => {
            if (unlockAnims.includes(anim.key)) {
                playerCombatLock = null;
                if (anim.key === 'dash_anim' || anim.key === 'ldash_anim' || anim.key === 'roll_anim') player.setVelocityX(0);
                if (anim.key === 'roll_anim') {
                    player._rollDir = 0;
                    restorePlayerPhysicsDefaults(player);
                    applyPlayerMatterFilter(playerMaskAll());
                }
            }
            if (anim.key === 'death_anim') playerCombatLock = 'dead';
        });
 
        camera = this.cameras.main;
        applyCameraBounds(currentLevel);
        camera.startFollow(player, true, 0.1, 0.1);
 
        uiCamera = this.cameras.add(0, 0, window.innerWidth, window.innerHeight);
        uiCamera.setScroll(0, 0).setZoom(1);
        uiCamera.transparent = true;
        uiCamera.ignore([bg1, bg2, bg3, layer1, layer2, player]);
 
        buildHUD.call(this);
        camera.ignore([hudBg, hudText, hudPlayerIcon, playerHpBarBg, playerHpBarFill, ultBarBg, ultBarFill, ultStateLabel, hudItemsLine,
            enemyHpBarBg, enemyHpBarFill, enemyHpLabel, enemyIcon, allyIcon, allyHpBarBg, allyHpBarFill, allyHpLabel,
            fkAllyIcon, fkAllyHpBarBg, fkAllyHpBarFill, fkAllyHpLabel,
            wkAllyIcon, wkAllyHpBarBg, wkAllyHpBarFill, wkAllyHpLabel,
            gmAllyIcon, gmAllyHpBarBg, gmAllyHpBarFill, gmAllyHpLabel,
            mbAllyIcon, mbAllyHpBarBg, mbAllyHpBarFill, mbAllyHpLabel]);
 
        spawnEnemy.call(this, levelStarts[0].enemyX, levelStarts[0].enemyY);
        spawnWindHashiraNpc.call(this);
        spawnFireWaterNpc.call(this);
        spawnGroundSoundNpc.call(this);
 
        this.lastQDownMs = 0;
        startPhaserAudio(scene);
 
        this.matter.world.on('collisionactive', (event) => {
            event.pairs.forEach(pair => {
                if (!player) return;
                const goA = pair.bodyA.gameObject;
                const goB = pair.bodyB.gameObject;
                if (goA !== player && goB !== player) return;
                const other = goA === player ? pair.bodyB : pair.bodyA;
                if (isTerrainBody(other)) {
                    playerGroundContacts = Math.max(playerGroundContacts, 1);
                }
            });
        });

        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach(pair => {
                trackPlayerGroundCollision(pair, 1);
                const bodyA = pair.bodyA, bodyB = pair.bodyB;
                const goA = bodyA.gameObject, goB = bodyB.gameObject;
                const hitEnemy = goA === enemy || goB === enemy || goA === enemy2 || goB === enemy2;
                const hitPlayer = goA === player || goB === player;
 
                const pPickup = bodyA.label === 'pickup' || bodyB.label === 'pickup';
                if (hitPlayer && pPickup) {
                    const pgo = bodyA.label === 'pickup' ? goA : goB;
                    if (pgo && pgo.getData('isBossLoot')) collectBossLoot(gameSceneRef, pgo);
                    return;
                }
 
                let starObj = bodyA.label === 'star' ? goA : bodyB.label === 'star' ? goB : null;
                if (!starObj && hitEnemy) {
                    if (goA && goA !== enemy && goA.texture && goA.texture.key === 'star') starObj = goA;
                    else if (goB && goB !== enemy && goB.texture && goB.texture.key === 'star') starObj = goB;
                }
                if (hitEnemy && starObj) {
                    if (starObj) starObj.destroy();
                    const tgt = (goA === enemy || goB === enemy) ? enemy : (goA === enemy2 || goB === enemy2) ? enemy2 : null;
                    damageEnemy(gameSceneRef, DAMAGE_KUNAI, { target: tgt });
                }
 
                let fireballGo = bodyA.label === 'fireball' ? goA : bodyB.label === 'fireball' ? goB : null;
                if (!fireballGo && hitPlayer) {
                    if (goA && goA !== player && goA.texture && goA.texture.key === 'demon_proj') fireballGo = goA;
                    else if (goB && goB !== player && goB.texture && goB.texture.key === 'demon_proj') fireballGo = goB;
                }
                if (hitPlayer && fireballGo && fireballGo.active) {
                    const keysRef = gameSceneRef && gameSceneRef.keys;
                    const blocking = keysRef && keysRef.i.isDown && playerCombatLock === 'block';
                    fireballGo.destroy();
                    if (blocking || isPlayerDodgeInvulnerable()) return;
                    damagePlayer(gameSceneRef, DAMAGE_FIREBALL);
                }
            });
        });

        this.matter.world.on('collisionend', (event) => {
            event.pairs.forEach(pair => trackPlayerGroundCollision(pair, -1));
        });
    }

    update() { updateGame(this); }
}

const PLAYER_MAX_HP = 100;
const ENEMY_MAX_HP = 100;
const DAMAGE_FIREBALL = 18;
const UPPER5_HP_MULT_L2_TO_L5 = 2;
const DAMAGE_UPPER5_MELEE = 22;
const BOSS_HP_SCALE_PER_LEVEL = 0.12;
const BOSS_DMG_SCALE_PER_LEVEL = 0.06;
const PLAYER_BOSS_HIT_IFRAME_MS = 520;
const UPPER5_HURT_LOCK_MS = 300;
const UPPER5_FOLLOW_SPEED = 3.1;
const UPPER5_MELEE_RANGE = 80;
const UPPER5_VISUAL_Y_OFFSET = 14;
const DAMAGE_ATK1 = 5;
const DAMAGE_ATK2 = 12;
const DAMAGE_ATK3 = 16;
const DAMAGE_ULT = 75;
const DAMAGE_AIR = 12;
const DAMAGE_KUNAI = 10;

const DEMON_SHOOT_RANGE = 520;
const DEMON_SHOOT_COOLDOWN_MIN = 4500;
const DEMON_SHOOT_COOLDOWN_MAX = 7000;

const MAP_MIN_X = 8;
const MAP_MAX_X = 900;
const POTION_HEAL = 20;
const ULT_CHARGE_PER_HIT = 7;
const LOOT_BONUS_KUNAI = 5;
const LOOT_BONUS_POTIONS = 3;
const KUNAI_START = 7;
const POTION_START = 1;
const POTION_MAX = 99;
const CD_Z_MS = 600;
const CD_X_MS = 900;
const CD_C_MS = 5000;

const ULT_SFX = {
    prepDelayMs: 1050,
    burstCount: 6,
    burstIntervalMs: 88,
    soundJitterMs: 18,
    damagePerTick: Math.max(1, Math.round(DAMAGE_ULT / 6))
};

// ── FIX 1: Player can move through enemies ────────────────────────────────────
// Remove MAT.EN from the player's default collision mask so the player's
// physics body no longer blocks against enemy bodies. Attacks still land via
// distance checks, not physics overlap, so combat is unaffected.
const MAT = { TERR: 0x1, PL: 0x2, EN: 0x4, STAR: 0x8, FB: 0x10, LOOT: 0x20, ALLY: 0x40 };
const playerMaskAll  = () => (MAT.TERR | MAT.STAR | MAT.FB | MAT.LOOT);  // EN removed
const playerMaskRoll = () => (MAT.TERR | MAT.FB | MAT.LOOT);

let _webAudio;
function getAudioCtx() {
    if (_webAudio) return _webAudio;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) _webAudio = new AC();
    return _webAudio;
}

function beepSfx(freq, dur, type = 'sine', vol = 0.09) {
    const c = getAudioCtx();
    if (!c) return;
    c.resume && c.resume();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur + 0.03);
}

function startPhaserAudio(scene) {
    if (!scene || !scene.sound) return;
    if (bgmSound && bgmSound.isPlaying) return;
    if (!scene.cache || !scene.cache.audio || !scene.cache.audio.exists('bgm')) return;

    bgmSound = scene.sound.add('bgm', { loop: true, volume: 0.35 });

    const tryStart = () => {
        if (!bgmSound || bgmSound.isPlaying) return;
        try { bgmSound.play(); } catch (e) { /* ignore autoplay issues */ }
    };

    scene.input.once('pointerdown', tryStart);
    if (scene.input.keyboard) scene.input.keyboard.once('keydown', tryStart);
    scene.time.delayedCall(0, tryStart);
}

function playSfxSlash() {
    if (gameSceneRef && gameSceneRef.sound && gameSceneRef.cache && gameSceneRef.cache.audio && gameSceneRef.cache.audio.exists('sword_sfx')) {
        gameSceneRef.sound.play('sword_sfx', { volume: 0.55 });
        return;
    }
    const c = getAudioCtx();
    if (!c) return;
    c.resume && c.resume();
    const o1 = c.createOscillator();
    const g = c.createGain();
    const t = c.currentTime;
    o1.type = 'sawtooth';
    o1.frequency.setValueAtTime(900, t);
    o1.frequency.exponentialRampToValueAtTime(200, t + 0.08);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o1.connect(g);
    g.connect(c.destination);
    o1.start(t);
    o1.stop(t + 0.12);
}

function playSfxKunaiThrow() {
    if (gameSceneRef && gameSceneRef.sound && gameSceneRef.cache && gameSceneRef.cache.audio && gameSceneRef.cache.audio.exists('sfx_throw')) {
        gameSceneRef.sound.play('sfx_throw', { volume: 0.7 });
        return;
    }
    beepSfx(1400, 0.06, 'square', 0.07);
    beepSfx(900, 0.05, 'sine', 0.05);
}


function _playLoaded(key, volume) {
    if (gameSceneRef && gameSceneRef.sound && gameSceneRef.cache && gameSceneRef.cache.audio && gameSceneRef.cache.audio.exists(key)) {
        gameSceneRef.sound.play(key, { volume: volume });
        return true;
    }
    return false;
}

function playSfxPotion() {
    if (_playLoaded('sfx_potion', 0.80)) return;
    beepSfx(600, 0.18, 'sine', 0.08);
    beepSfx(900, 0.12, 'sine', 0.06);
}

function playSfxSuperAttack(){
    if (_playLoaded('v_attack', 0.80)) return;
    beepSfx(600, 0.18, 'sine', 0.08);
    beepSfx(900, 0.12, 'sine', 0.06);
}
let sliceCounter = 0;
function playSfxSlice() {
    sliceCounter = (sliceCounter + 1) % 2;
    const sliceKey = sliceCounter === 0 ? 'sfx_slice1' : 'sfx_slice2';
    if (_playLoaded(sliceKey, 0.65)) return;
}

let hitDamageCounter = 0;
function playSfxHitDamage() {
    hitDamageCounter = (hitDamageCounter + 1) % 2;
    const damageKey = hitDamageCounter === 0 ? 'sfx_hit_damage1' : 'sfx_hit_damage2';
    if (_playLoaded(damageKey, 0.70)) return;
}

function playSfxImpact() {
    if (_playLoaded('sfx_impact', 0.75)) return;
}

function playSfxUltSlash(jitter) {
    if (gameSceneRef && gameSceneRef.sound && gameSceneRef.cache && gameSceneRef.cache.audio && gameSceneRef.cache.audio.exists('sword_sfx')) {
        gameSceneRef.sound.play('sword_sfx', { volume: 0.35 });
        return;
    }
    const c = getAudioCtx();
    if (!c) return;
    c.resume && c.resume();
    
    // SAFETY FIX: Ensure t is NEVER smaller than c.currentTime and never negative
    let t = c.currentTime + (jitter || 0) * 0.001;
    if (t < c.currentTime) {
        t = c.currentTime;
    }

    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    
    o.frequency.setValueAtTime(480 + Math.random() * 120, t);
    o.frequency.exponentialRampToValueAtTime(120, t + 0.11);
    
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + 0.15);
}

function applyPlayerMatterFilter(maskBits) {
    if (!player || !player.body) return;
    player.body.collisionFilter = { group: 0, category: MAT.PL, mask: maskBits };
}

function initStaticMatterFlags(scene) {
    const maskBits = MAT.PL | MAT.EN | MAT.STAR | MAT.FB | MAT.LOOT | MAT.ALLY;
    scene.matter.world.getAllBodies().forEach(b => {
        if (b.isStatic) {
            b.collisionFilter = { group: 0, category: MAT.TERR, mask: maskBits };
        }
    });
}

function applyEnemyMatterFilter() {
    const applyOne = (e) => {
        if (!e || !e.body) return;
        e.body.collisionFilter = { group: 0, category: MAT.EN, mask: MAT.TERR | MAT.STAR | MAT.LOOT };
    };
    applyOne(enemy);
    applyOne(enemy2);
}

function setStarMatterFilter(star) {
    if (star && star.body) {
        star.body.collisionFilter = { group: 0, category: MAT.STAR, mask: MAT.TERR | MAT.EN };
    }
}

function setFireballMatterFilter(fb) {
    if (fb && fb.body) {
        fb.body.collisionFilter = { group: 0, category: MAT.FB, mask: MAT.TERR | MAT.PL };
    }
}

function setLootMatterFilter(lo) {
    if (lo && lo.body) {
        lo.body.collisionFilter = { group: 0, category: MAT.LOOT, mask: MAT.TERR | MAT.PL | MAT.EN };
    }
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    pixelArt: true,
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.NO_CENTER
    },
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            debug: false
        }
    },
    scene: [IntroScene, StartScene, GameScene, EndScene]
};

const game = new Phaser.Game(config);

let gameSceneRef = null;

let playerName = 'Samurai';

let player, enemy, enemy2;
let cursors, enterKey, spaceKey, pointer;
let camera, uiCamera;
let currentLevel = 1;
let death = false;

let playerCombatLock = null;

let hudBg, hudText, hudPlayerIcon;
let playerHpBarBg, playerHpBarFill;
let ultBarBg, ultBarFill, ultStateLabel, hudItemsLine;
let enemyHpBarBg, enemyHpBarFill, enemyHpLabel, enemyIcon;
let enemy2HpBarBg, enemy2HpBarFill, enemy2HpLabel, enemy2Icon;
let kunaiCount;
let potionCount;
let ultimateCharge;
let bossDropSpawned;
let isGameOver;
let gameOverContainer;
let gameOverTextObj;
let gameOverRectObj;
let bgmSound;
let cooldowns;

let playerHp = PLAYER_MAX_HP;

// Wind Hashira ally
let ally = null;
let allyHp = 0;
let allyRecruited = false;
let allyDialogBox = null;
let allyDialogText = null;
let allyHpBarBg = null;
let allyHpBarFill = null;
let allyHpLabel = null;
let allyIcon = null;
const ALLY_MAX_HP = 320;
const ALLY_POTION_COST = 3;

// Fire Hashira ally
let fkAlly = null;
let fkAllyHp = 0;
let fkAllyRecruited = false;
let fkAllyHpBarBg = null;
let fkAllyHpBarFill = null;
let fkAllyHpLabel = null;
let fkAllyIcon = null;
const FK_ALLY_MAX_HP = 320;

// Water Hashira ally
let wkAlly = null;
let wkAllyHp = 0;
let wkAllyRecruited = false;
let wkAllyHpBarBg = null;
let wkAllyHpBarFill = null;
let wkAllyHpLabel = null;
let wkAllyIcon = null;
const WK_ALLY_MAX_HP = 320;

let fwAllyDialogBox = null;
let fwAllyDialogText = null;
let fwAllyDialogShown = false;
const FW_ALLY_POTION_COST = 3;

// Stone Hashira ally
let gmAlly = null;
let gmAllyHp = 0;
let gmAllyRecruited = false;
let gmAllyHpBarBg = null;
let gmAllyHpBarFill = null;
let gmAllyHpLabel = null;
let gmAllyIcon = null;
const GM_ALLY_MAX_HP = 320;

// Metal Bladekeeper (Sound Hashira) ally
let mbAlly = null;
let mbAllyHp = 0;
let mbAllyRecruited = false;
let mbAllyHpBarBg = null;
let mbAllyHpBarFill = null;
let mbAllyHpLabel = null;
let mbAllyIcon = null;
const MB_ALLY_MAX_HP = 320;

let gsAllyDialogBox = null;
let gsAllyDialogText = null;
let gsAllyDialogShown = false;
const GS_ALLY_POTION_COST = 3;

let doubleJumpReady = true;
let airJumpsUsed = 0;
const MAX_AIR_JUMPS = 1;
let wasGrounded = true;
let playerGroundContacts = 0;

function isTerrainBody(body) {
    return body && body.isStatic && !body.isSensor;
}

function trackPlayerGroundCollision(pair, delta) {
    if (!player) return;
    const goA = pair.bodyA.gameObject;
    const goB = pair.bodyB.gameObject;
    if (goA !== player && goB !== player) return;
    const other = goA === player ? pair.bodyB : pair.bodyA;
    if (isTerrainBody(other)) {
        playerGroundContacts = Math.max(0, playerGroundContacts + delta);
    }
}

const levelStarts = [
    { level: 1, x: 43,  y: 200,  enemyX: 740, enemyY: 250,  camTop: 0,    camBot: 480  },
    { level: 2, x: 43,  y: 560,  enemyX: 797, enemyY: 540,  camTop: 380,  camBot: 760  },
    // Level 3: player center, Upper 4 left, Upper 3 right
    { level: 3, x: 450, y: 840,  enemyX: 250, enemyY: 840,  camTop: 700,  camBot: 1080 },
    { level: 4, x: 450, y: 1050, enemyX: 250, enemyY: 1050, camTop: 960,  camBot: 1340 },
    // Level 5: Shadow Stalker final boss
    { level: 5, x: 43,  y: 1330, enemyX: 700, enemyY: 1310, camTop: 1180, camBot: 1650 }
];

const DOOR_X = 890;

function buildHUD() {
    const PAD = 10;
    const iconSize = 48;
    const W = this.scale.width;
    const H = this.scale.height;

    hudBg = this.add.rectangle(PAD, PAD, 400, 140, 0x000000, 0.75)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(100);

    hudPlayerIcon = this.add.image(PAD + 6, PAD + 6, 'player_icon')
        .setOrigin(0, 0)
        .setDisplaySize(iconSize, iconSize)
        .setScrollFactor(0)
        .setDepth(101);

    const barY = PAD + iconSize + 4;
    playerHpBarBg = this.add.rectangle(PAD + 4, barY, 200, 8, 0x330000, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(101);
    playerHpBarFill = this.add.rectangle(PAD + 4, barY, 200, 8, 0x00cc44, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(102);

    const ultY = barY + 10;
    ultBarBg = this.add.rectangle(PAD + 4, ultY, 200, 6, 0x001133, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(101);
    ultBarFill = this.add.rectangle(PAD + 4, ultY, 0, 6, 0x44aaff, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(102);
    ultStateLabel = this.add.text(PAD + 4, ultY + 8, 'Ult  0%', {
        font: 'bold 10px monospace', fill: '#99ccff'
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(103);

    hudItemsLine = this.add.text(PAD + 4, ultY + 22, '', {
        font: 'bold 12px monospace', fill: '#aaffcc'
    }).setScrollFactor(0).setDepth(101);

    hudText = this.add.text(PAD + iconSize + 14, PAD + 6, '', {
        font: 'bold 12px monospace',
        fill: '#ffff00',
        lineSpacing: 3
    }).setScrollFactor(0).setDepth(101);

    const eBarW = Math.min(420, W - 24);
    const eBarX = (W - eBarW) / 2;
    const eBarY = H - 42;

    enemyHpLabel = this.add.text(eBarX + eBarW / 2, eBarY - 18, 'Demon', {
        font: 'bold 14px Arial',
        fill: '#ffcccc'
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(102);

    enemyIcon = this.add.image(eBarX - 28, eBarY + 7, 'ss_icon')
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(103)
        .setDisplaySize(28, 28)
        .setVisible(false);

    enemyHpBarBg = this.add.rectangle(eBarX, eBarY, eBarW, 14, 0x220000, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(100);
    enemyHpBarFill = this.add.rectangle(eBarX, eBarY, eBarW, 14, 0xcc2222, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(101);

    const e2BarY = eBarY - 52;
    enemy2Icon = this.add.image(eBarX, e2BarY - 10, 'lightning_elemental_icon')
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(103)
        .setDisplaySize(22, 22)
        .setVisible(false);
    enemy2HpLabel = this.add.text(eBarX + 30, e2BarY - 18, '', {
        font: 'bold 14px Arial',
        fill: '#ffcccc'
    }).setOrigin(0, 1).setScrollFactor(0).setDepth(102).setVisible(false);
    enemy2HpBarBg = this.add.rectangle(eBarX, e2BarY, eBarW, 14, 0x220000, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(100)
        .setVisible(false);
    enemy2HpBarFill = this.add.rectangle(eBarX, e2BarY, eBarW, 14, 0xcc2222, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(101)
        .setVisible(false);

    const allyBarX = PAD + 4;
    const allyBarY = H - 88;
    allyIcon = this.add.image(allyBarX, allyBarY + 7, 'ally_icon')
        .setOrigin(0, 0.5).setDisplaySize(32, 32).setScrollFactor(0).setDepth(101).setVisible(false);
    allyHpLabel = this.add.text(allyBarX + 36, allyBarY - 10, 'Wind Hashira', {
        font: 'bold 11px Arial', fill: '#aaffee'
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(101).setVisible(false);
    allyHpBarBg = this.add.rectangle(allyBarX + 36, allyBarY, 160, 10, 0x003322, 1)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(100).setVisible(false);
    allyHpBarFill = this.add.rectangle(allyBarX + 36, allyBarY, 160, 10, 0x33ff99, 1)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(101).setVisible(false);

    const fkBarY = allyBarY - 30;
    fkAllyIcon = this.add.image(allyBarX, fkBarY + 7, 'fk_icon')
        .setOrigin(0, 0.5).setDisplaySize(32, 32).setScrollFactor(0).setDepth(101).setVisible(false);
    fkAllyHpLabel = this.add.text(allyBarX + 36, fkBarY - 10, 'Fire Hashira', {
        font: 'bold 11px Arial', fill: '#ff9944'
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(101).setVisible(false);
    fkAllyHpBarBg = this.add.rectangle(allyBarX + 36, fkBarY, 160, 10, 0x331100, 1)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(100).setVisible(false);
    fkAllyHpBarFill = this.add.rectangle(allyBarX + 36, fkBarY, 160, 10, 0xff6622, 1)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(101).setVisible(false);

    const wkBarY = fkBarY - 30;
    wkAllyIcon = this.add.image(allyBarX, wkBarY + 7, 'wk_icon')
        .setOrigin(0, 0.5).setDisplaySize(32, 32).setScrollFactor(0).setDepth(101).setVisible(false);
    wkAllyHpLabel = this.add.text(allyBarX + 36, wkBarY - 10, 'Water Hashira', {
        font: 'bold 11px Arial', fill: '#44aaff'
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(101).setVisible(false);
    wkAllyHpBarBg = this.add.rectangle(allyBarX + 36, wkBarY, 160, 10, 0x001133, 1)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(100).setVisible(false);
    wkAllyHpBarFill = this.add.rectangle(allyBarX + 36, wkBarY, 160, 10, 0x22aaff, 1)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(101).setVisible(false);

    const gmBarY = wkBarY - 30;
    gmAllyIcon = this.add.image(allyBarX, gmBarY + 7, 'gm_icon')
        .setOrigin(0, 0.5).setDisplaySize(32, 32).setScrollFactor(0).setDepth(101).setVisible(false);
    gmAllyHpLabel = this.add.text(allyBarX + 36, gmBarY - 10, 'Stone Hashira', {
        font: 'bold 11px Arial', fill: '#cc9944'
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(101).setVisible(false);
    gmAllyHpBarBg = this.add.rectangle(allyBarX + 36, gmBarY, 160, 10, 0x221100, 1)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(100).setVisible(false);
    gmAllyHpBarFill = this.add.rectangle(allyBarX + 36, gmBarY, 160, 10, 0xbb8833, 1)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(101).setVisible(false);

    const mbBarY = gmBarY - 30;
    mbAllyIcon = this.add.image(allyBarX, mbBarY + 7, 'mb_icon')
        .setOrigin(0, 0.5).setDisplaySize(32, 32).setScrollFactor(0).setDepth(101).setVisible(false);
    mbAllyHpLabel = this.add.text(allyBarX + 36, mbBarY - 10, 'Sound Hashira', {
        font: 'bold 11px Arial', fill: '#cc44cc'
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(101).setVisible(false);
    mbAllyHpBarBg = this.add.rectangle(allyBarX + 36, mbBarY, 160, 10, 0x220033, 1)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(100).setVisible(false);
    mbAllyHpBarFill = this.add.rectangle(allyBarX + 36, mbBarY, 160, 10, 0xcc44cc, 1)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(101).setVisible(false);
}

function applyCameraBounds(levelNum) {
    const lvl = levelStarts.find(l => l.level === levelNum);
    if (!lvl) return;
    const mapW = 1024;
    const topPad = 32;
    const h = (lvl.camBot - lvl.camTop) + topPad;
    camera.setBounds(-8, lvl.camTop - topPad, mapW, h);
}

function setEnemyFacingTowardPlayer() {
    const faceOne = (e) => {
        if (!e || !e.active || !player) return;
        const tgt = getClosestTarget(e);
        const targetLeft = tgt.x < e.x;
        if (e.kind === 'upper6' || e.kind === 'upper4_db') {
            e.setFlipX(!targetLeft);
        } else if (e.kind !== 'upper4_imp') {
            e.setFlipX(targetLeft);
        }
    };
    faceOne(enemy);
    faceOne(enemy2);
}

function isAliveBoss(e) {
    return !!(e && e.active && e.state !== 'DEATH');
}

function nearestBossToPlayer() {
    if (!player) return enemy || enemy2 || null;
    const cands = [enemy, enemy2].filter(e => e && e.active && e.state !== 'DEATH');
    if (cands.length === 0) return null;
    cands.sort((a, b) => Phaser.Math.Distance.Between(player.x, player.y, a.x, a.y) - Phaser.Math.Distance.Between(player.x, player.y, b.x, b.y));
    return cands[0];
}

function getClosestTarget(boss) {
    const b = boss || enemy || enemy2;
    if (!b || !b.active) return player;

    let closest = player;
    let closestDist = Phaser.Math.Distance.Between(player.x, player.y, b.x, b.y);

    const checkAlly = (a) => {
        if (!a || !a.active || a._state === 'DEAD') return;
        const d = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
        if (d < closestDist) { closestDist = d; closest = a; }
    };

    if (allyRecruited)   checkAlly(ally);
    if (fkAllyRecruited) checkAlly(fkAlly);
    if (wkAllyRecruited) checkAlly(wkAlly);
    if (gmAllyRecruited) checkAlly(gmAlly);
    if (mbAllyRecruited) checkAlly(mbAlly);

    return closest;
}

const MELEE_ATK_ANIMS = new Set(['atk1_anim', 'atk2_anim', 'atk3_anim', 'ult_anim', 'air_atk_anim']);

function syncPlayerAttackLockWithMeleeAnim(ak) {
    if (playerCombatLock === 'dead' || playerCombatLock === 'hurt') return;
    const ca = player.anims && player.anims.currentAnim;
    if (MELEE_ATK_ANIMS.has(ak) && ca && ca.isPlaying) {
        playerCombatLock = 'attack';
    }
}

function isPlayerDodgeInvulnerable() {
    const k = player.anims.currentAnim && player.anims.currentAnim.key;
    return k === 'roll_anim' || k === 'ldash_anim';
}

function isPlayerActionUninterruptible() {
    if (!player || !player.anims || !player.anims.currentAnim) return false;
    const k = player.anims.currentAnim.key;
    return k === 'atk1_anim' ||
        k === 'atk2_anim' ||
        k === 'atk3_anim' ||
        k === 'ult_anim' ||
        k === 'air_atk_anim' ||
        k === 'dash_anim' ||
        k === 'ldash_anim' ||
        k === 'roll_anim';
}

function getCooldownRemaining(now, key) {
    if (!cooldowns) return 0;
    return Math.max(0, (cooldowns[key] || 0) - now);
}

function isMoveReady(now, key) {
    return getCooldownRemaining(now, key) <= 0;
}

function startMoveCooldown(now, key, ms) {
    if (!cooldowns) return;
    cooldowns[key] = now + ms;
}

function formatCd(remMs) {
    if (remMs <= 0) return 'READY';
    return `${(remMs / 1000).toFixed(1)}s`;
}

function restorePlayerPhysicsDefaults(p) {
    if (!p || !p.body) return;
    p.body.friction = 0.05;
    p.body.frictionAir = 0.02;
}

function scheduleMeleeHit(scene, animKey, delayMs, damage, opts = {}) {
    scene.time.delayedCall(delayMs, () => {
        if (!player || !player.anims.currentAnim) return;
        if (player.anims.currentAnim.key !== animKey) return;
        const tgt = nearestBossToPlayer();
        if (!tgt || !tgt.active || tgt.state === 'DEATH') return;
        const d = Phaser.Math.Distance.Between(player.x, player.y, tgt.x, tgt.y);
        if (d > 120) return;
        damageEnemy(scene, damage, { skipUltCharge: !!opts.skipUltCharge, target: tgt });
        if (opts.ultGainOverride != null && !Number.isNaN(opts.ultGainOverride)) {
            ultimateCharge = Math.min(100, ultimateCharge + opts.ultGainOverride);
        }
    });
}

function addUltimateChargeOnHit() {
    ultimateCharge = Math.min(100, ultimateCharge + ULT_CHARGE_PER_HIT);
}

function damageEnemy(scene, amount, opts = {}) {
    const tgt = opts.target || nearestBossToPlayer();
    if (!tgt || !tgt.active || tgt.state === 'DEATH') return;
    if (tgt.invulnerable) return;
    tgt.hp -= amount;
    if (tgt.hp < 0) tgt.hp = 0;
    tgt.setTint(0xff3333);
    playSfxHitDamage();
    scene.time.delayedCall(70, () => { if (tgt && tgt.active) tgt.clearTint(); });
    if (!opts.skipUltCharge) {
        addUltimateChargeOnHit();
    }
    if (tgt.hp <= 0) {
        tgt.state = 'DEATH';
        if (tgt.kind === 'upper1') {
            tgt.setVelocityX(0);
            if (tgt.body) tgt.setStatic(true);
        } else if (tgt.kind !== 'upper4_imp') {
            if (!isAliveBoss(enemy) && !isAliveBoss(enemy2)) {
                death = true;
                trySpawnBossLoot(scene, tgt.x, tgt.y);
            }
        }
    } else if (tgt.kind === 'upper5') {
        const now = gameSceneRef ? gameSceneRef.time.now : Date.now();
        if (tgt.state !== 'DEATH') {
            if (tgt.state !== 'HURT' || now >= (tgt._hurtUntil || 0)) {
                tgt.state = 'HURT';
                tgt._hurtUntil = now + UPPER5_HURT_LOCK_MS;
            }
            tgt.setVelocityX(0);
            tgt.play('nb_hurt', false);
        }
    } else if (tgt.kind === 'upper4_imp') {
        if (!tgt.phase2Spawned && tgt.hp <= 150) {
            tgt.phase2Spawned = true;
            tgt.displayName = 'Upper 4 — Phase 2';
            tgt.state = 'DEATH';
            tgt.setVelocityX(0);
            tgt.play('imp_death', false);
        } else if (tgt.state !== 'SWING' && tgt.state !== 'DEATH' && tgt.state !== 'HURT') {
            tgt.state = 'HURT';
            tgt.setVelocityX(0);
            tgt.play('imp_hurt', false);
            tgt.once('animationcomplete', (a) => {
                if (a.key === 'imp_hurt' && tgt && tgt.active && tgt.state === 'HURT') {
                    tgt.state = 'FOLLOW';
                }
            });
        }
    } else if (tgt.kind === 'upper4_db') {
        if (tgt.state !== 'SWING' && tgt.state !== 'DEATH') {
            tgt.state = 'HURT';
            tgt.setVelocityX(0);
            tgt.play('db_hurt', false);
        }
    } else if (tgt.kind === 'upper2') {
        if (!tgt.isFlaming && tgt.hp <= 250 && !tgt.didShout) {
            tgt.didShout = true;
            tgt.state = 'SHOUT';
            tgt.setVelocityX(0);
            tgt.play('ds_shout', false);
        } else if (tgt.state !== 'SWING' && tgt.state !== 'DEATH' && tgt.state !== 'DEFEND' && tgt.state !== 'SHOUT') {
            tgt.state = 'HURT';
            tgt.setVelocityX(0);
            tgt.play(tgt.isFlaming ? 'dsf_hurt' : 'ds_hurt', false);
        }
    } else if (tgt.kind === 'upper3') {
        if (!tgt.phase2 && tgt.hp > 0 && tgt.hp <= tgt.maxHp * 0.5) {
            tgt.phase2 = true;
            tgt.phase = 2;
            tgt.displayName = 'Upper 3 — Phase 2';
            tgt.setScale(1.14);
            tgt.setTint(0xffaaaa);
            refreshHpBars();
        }
        if (tgt.state !== 'SWING' && tgt.state !== 'DEATH' && tgt.state !== 'HURT') {
            tgt.state = 'HURT';
            tgt.setVelocityX(0);
            tgt.play('ds3_take_hit', false);
            tgt._hurtUntil = (gameSceneRef ? gameSceneRef.time.now : Date.now()) + (5 / 12 * 1000) + 100;
        }
    } else if (tgt.kind === 'upper1') {
        if (tgt.state !== 'DEATH' && tgt.state !== 'HURT') {
            tgt.state = 'HURT';
            tgt.setVelocityX(0);
            tgt.play('el_hurt', false);
            tgt._hurtUntil = (gameSceneRef ? gameSceneRef.time.now : Date.now()) + (6 / 14 * 1000) + 100;
        }
    } else if (tgt.kind === 'antagonist') {
        if (!tgt.isElemental && !tgt.didTransform && tgt.hp <= tgt.maxHp * 0.75) {
            tgt.didTransform = true;
            tgt.invulnerable = true;
            tgt.state = 'TRANSFORM';
            tgt.setVelocityX(0);
            tgt.play('ss_transform', false);
            const transformMs = (37 / 14) * 1000 + 300;
            if (gameSceneRef) {
                gameSceneRef.time.delayedCall(transformMs, () => {
                    if (!tgt || !tgt.active) return;
                    tgt.isElemental = true;
                    tgt.invulnerable = false;
                    tgt.attackIndex = 0;
                    tgt.state = 'FOLLOW';
                    tgt.play('ss_e_idle', true);
                });
            }
        } else if (tgt.state !== 'DEATH' && tgt.state !== 'HURT' && tgt.state !== 'TRANSFORM') {
            tgt.state = 'HURT';
            tgt.setVelocityX(0);
            tgt._hurtUntil = (gameSceneRef ? gameSceneRef.time.now : Date.now()) + 250;
        }
    }
}

function destroyBosses() {
    if (enemy && enemy.active) enemy.destroy();
    if (enemy2 && enemy2.active) enemy2.destroy();
    enemy = null;
    enemy2 = null;
}

/** After level 5 final boss dies — play win cinematic. Safe to call multiple times. */
function scheduleWinEndScene(scene, delayMs) {
    if (!scene || !scene.sys || !scene.sys.isActive()) return;
    if (scene._winEndScheduled) return;
    scene._winEndScheduled = true;
    death = true;

    const goEnd = () => {
        if (!scene || !scene.sys || !scene.sys.isActive()) return;
        try {
            if (bgmSound && bgmSound.isPlaying) bgmSound.stop();
        } catch (e) { /* ignore */ }
        scene.scene.start('EndScene', { win: true });
    };

    if (delayMs > 0) scene.time.delayedCall(delayMs, goEnd);
    else goEnd();
}

function showBossHudSlotB(show, withIcon) {
    if (!enemy2HpBarBg || !enemy2HpBarFill || !enemy2HpLabel || !enemy2Icon) return;
    enemy2HpBarBg.setVisible(!!show);
    enemy2HpBarFill.setVisible(!!show);
    enemy2HpLabel.setVisible(!!show);
    enemy2Icon.setVisible(!!show && !!withIcon);
}

function trySpawnBossLoot(scene, x, y) {
    if (bossDropSpawned) return;
    bossDropSpawned = true;
    const lx = x != null ? x : (enemy ? enemy.x : player.x);
    const ly = (y != null ? y : (enemy ? enemy.y : player.y)) - 20;
    const drop = scene.matter.add.image(lx, ly, 'loot_kunai', null, {
        isSensor: true,
        isStatic: false,
        shape: { type: 'circle', radius: 18 },
        label: 'pickup'
    });
    if (drop.body) {
        drop.body.label = 'pickup';
        drop.body.isSensor = true;
    }
    drop.setScale(0.55);
    drop.setDepth(9);
    drop.setData('isBossLoot', true);
    setLootMatterFilter(drop);
    if (uiCamera) uiCamera.ignore([drop]);
    scene.tweens.add({ targets: drop, y: ly - 8, yoyo: true, duration: 800, repeat: -1, ease: 'Sine.easeInOut' });
}

function collectBossLoot(scene, go) {
    if (!scene || !go || !go.active) return;
    if (go.getData && go.getData('collected')) return;
    if (go.setData) go.setData('collected', true);

    try { scene.tweens && scene.tweens.killTweensOf(go); } catch (e) { /* ignore */ }
    if (go.body && go.body.collisionFilter) {
        go.body.collisionFilter.mask = 0;
        go.body.collisionFilter.category = 0;
    }
    scene.time.delayedCall(1, () => { if (go && go.active) go.destroy(); });

    kunaiCount += LOOT_BONUS_KUNAI;
    potionCount = Math.min(POTION_MAX, potionCount + LOOT_BONUS_POTIONS);
}

function showGameOver(scene) {
    if (gameOverRectObj) return;

    isGameOver = true;

    const W = scene.scale.width;
    const H = scene.scale.height;

    gameOverRectObj = scene.add.rectangle(0, 0, W, H, 0x000000, 0.72)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(500);

    gameOverTextObj = scene.add.text(W / 2, H / 2, 'GAME OVER\nPress SPACE to Try Again', {
        fontSize: Math.min(48, W / 20) + 'px',
        fontFamily: 'Arial',
        fill: '#ffffff',
        align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501);

    if (camera) {
        camera.ignore([gameOverRectObj, gameOverTextObj]);
    }

    scene.input.keyboard.once('keydown-SPACE', () => {
        isGameOver = false;
        gameOverRectObj = null;
        gameOverTextObj = null;
        playerCombatLock = null;
        playerHp = PLAYER_MAX_HP;
        death = false;
        currentLevel = 1;
        allyRecruited = false;
        fkAllyRecruited = false;
        wkAllyRecruited = false;
        gmAllyRecruited = false;
        mbAllyRecruited = false;
        scene.scene.start('StartScene');
    });
}

// ── FIX 2: V-attack (ultimate) crash fix ──────────────────────────────────────
// Guard every delayed callback: bail out early if the scene is no longer active,
// player is dead, or no living boss exists. This prevents the burst ticks from
// calling damageEnemy when combat has already ended (e.g. boss died mid-burst,
// or the scene restarted), which was the source of the freeze/crash.
function scheduleUltimateFury(scene) {
    const { prepDelayMs, burstCount, burstIntervalMs, soundJitterMs, damagePerTick } = ULT_SFX;
    scene.time.delayedCall(prepDelayMs, () => {
        // Abort if the scene is no longer running or the player is dead
        if (!scene || !scene.sys || !scene.sys.isActive()) return;
        if (!player || !player.active || playerCombatLock === 'dead') return;

        for (let i = 0; i < burstCount; i++) {
            scene.time.delayedCall(i * burstIntervalMs, () => {
                // Per-tick safety checks
                if (!scene || !scene.sys || !scene.sys.isActive()) return;
                if (!player || !player.active || playerCombatLock === 'dead') return;
                const tgt = nearestBossToPlayer();
                if (!tgt || !tgt.active || tgt.state === 'DEATH') return;

                const jitter = Phaser.Math.Between(-soundJitterMs, soundJitterMs);
                playSfxUltSlash(jitter);
                damageEnemy(scene, damagePerTick, { skipUltCharge: true, target: tgt });
            });
        }
    });
}

function bossHpForLevel(level, baseHp) {
    return Math.round(baseHp * (1 + Math.max(0, level - 2) * BOSS_HP_SCALE_PER_LEVEL));
}

function bossDmgForLevel(level, baseDmg) {
    return Math.round(baseDmg * (1 + Math.max(0, level - 2) * BOSS_DMG_SCALE_PER_LEVEL));
}

let playerBossHitUntil = 0;

function canBossMeleeHitPlayer(scene) {
    if (!scene || !player || !player.active) return false;
    if (scene.time.now < playerBossHitUntil) return false;
    if (isPlayerDodgeInvulnerable()) return false;
    const keysRef = scene.keys;
    if (keysRef && keysRef.i.isDown && playerCombatLock === 'block') return false;
    return true;
}

function applyBossMeleeToPlayer(scene, amount) {
    if (!canBossMeleeHitPlayer(scene)) return;
    playerBossHitUntil = scene.time.now + PLAYER_BOSS_HIT_IFRAME_MS;
    damagePlayer(scene, amount);
}

function scheduleBossMeleeHit(scene, attacker, delayMs, damage, hitRange, hitAllies) {
    const swingId = (attacker._swingId || 0) + 1;
    attacker._swingId = swingId;
    scene.time.delayedCall(delayMs, () => {
        if (!attacker || !attacker.active || attacker.state !== 'SWING') return;
        if (attacker._swingId !== swingId) return;
        const dp = Phaser.Math.Distance.Between(player.x, player.y, attacker.x, attacker.y);
        if (dp <= hitRange) applyBossMeleeToPlayer(scene, damage);
        if (hitAllies) _hitAllies(scene, attacker.x, attacker.y, hitRange, damage);
    });
}

function damagePlayer(scene, amount) {
    if (playerHp <= 0 || playerCombatLock === 'dead') return;
    if (isPlayerDodgeInvulnerable()) return;
    if (isPlayerActionUninterruptible()) return;
    playerHp -= amount;
    if (playerHp < 0) playerHp = 0;
    playSfxImpact();
    if (playerHp <= 0) {
        playerCombatLock = 'dead';
        player.setVelocity(0, 0);
        player.play('death_anim', false);
        scene.time.delayedCall(700, () => showGameOver(scene));
        return;
    }
    playerCombatLock = 'hurt';
    player.play('hurt_anim', false);
    player.once('animationcomplete', (a) => {
        if (a.key === 'hurt_anim' && playerCombatLock === 'hurt') {
            playerCombatLock = null;
        }
    });
}

function damageAlly(scene, amount) {
    if (!ally || !ally.active || ally._state === 'DEAD' || ally._state === 'NPC') return;
    if (ally._state === 'DEFEND') return;
    allyHp -= amount;
    if (allyHp < 0) allyHp = 0;
    ally.setTint(0xff6666);
    scene.time.delayedCall(80, () => { if (ally && ally.active) ally.clearTint(); });
    if (allyHp <= 0) {
        ally._state = 'DEAD';
        ally.setVelocityX(0);
        ally.play('wh_death', false);
        scene.time.delayedCall(2000, () => { if (ally && ally.active) ally.destroy(); ally = null; });
        return;
    }
    const milestone = (ally._lastHurtMilestone !== undefined) ? ally._lastHurtMilestone : ALLY_MAX_HP;
    if (allyHp <= milestone - 200) {
        ally._lastHurtMilestone = milestone - 200;
        ally._attackIndex = 0;
        ally._state = 'FOLLOW';
        ally.play('wh_hurt', false);
    }
}

function damageFkAlly(scene, amount) {
    if (!fkAlly || !fkAlly.active || fkAlly._state === 'DEAD' || fkAlly._state === 'NPC') return;
    if (fkAlly._state === 'DEFEND') return;
    fkAllyHp -= amount;
    if (fkAllyHp < 0) fkAllyHp = 0;
    fkAlly.setTint(0xff6666);
    scene.time.delayedCall(80, () => { if (fkAlly && fkAlly.active) fkAlly.clearTint(); });
    if (fkAllyHp <= 0) {
        fkAlly._state = 'DEAD';
        fkAlly.setVelocityX(0);
        fkAlly.play('fk_death', false);
        scene.time.delayedCall(2000, () => { if (fkAlly && fkAlly.active) fkAlly.destroy(); fkAlly = null; });
        return;
    }
    const milestone = (fkAlly._lastHurtMilestone !== undefined) ? fkAlly._lastHurtMilestone : FK_ALLY_MAX_HP;
    if (fkAllyHp <= milestone - 200) {
        fkAlly._lastHurtMilestone = milestone - 200;
        fkAlly._attackIndex = 0;
        fkAlly._state = 'FOLLOW';
        fkAlly.play('fk_hurt', false);
    }
}

function damageWkAlly(scene, amount) {
    if (!wkAlly || !wkAlly.active || wkAlly._state === 'DEAD' || wkAlly._state === 'NPC') return;
    if (wkAlly._state === 'DEFEND') return;
    wkAllyHp -= amount;
    if (wkAllyHp < 0) wkAllyHp = 0;
    wkAlly.setTint(0xff6666);
    scene.time.delayedCall(80, () => { if (wkAlly && wkAlly.active) wkAlly.clearTint(); });
    if (wkAllyHp <= 0) {
        wkAlly._state = 'DEAD';
        wkAlly.setVelocityX(0);
        wkAlly.play('wk_death', false);
        scene.time.delayedCall(2000, () => { if (wkAlly && wkAlly.active) wkAlly.destroy(); wkAlly = null; });
        return;
    }
    const milestone = (wkAlly._lastHurtMilestone !== undefined) ? wkAlly._lastHurtMilestone : WK_ALLY_MAX_HP;
    if (wkAllyHp <= milestone - 200) {
        wkAlly._lastHurtMilestone = milestone - 200;
        wkAlly._attackIndex = 0;
        wkAlly._state = 'FOLLOW';
        wkAlly.play('wk_hurt', false);
    }
}

function damageGmAlly(scene, amount) {
    if (!gmAlly || !gmAlly.active || gmAlly._state === 'DEAD' || gmAlly._state === 'NPC') return;
    if (gmAlly._state === 'DEFEND') return;
    gmAllyHp -= amount;
    if (gmAllyHp < 0) gmAllyHp = 0;
    gmAlly.setTint(0xff6666);
    scene.time.delayedCall(80, () => { if (gmAlly && gmAlly.active) gmAlly.clearTint(); });
    if (gmAllyHp <= 0) {
        gmAlly._state = 'DEAD';
        gmAlly.setVelocityX(0);
        gmAlly.play('gm_death', false);
        scene.time.delayedCall(2000, () => { if (gmAlly && gmAlly.active) gmAlly.destroy(); gmAlly = null; });
        return;
    }
    const milestone = (gmAlly._lastHurtMilestone !== undefined) ? gmAlly._lastHurtMilestone : GM_ALLY_MAX_HP;
    if (gmAllyHp <= milestone - 200) {
        gmAlly._lastHurtMilestone = milestone - 200;
        gmAlly._attackIndex = 0;
        gmAlly._state = 'FOLLOW';
        gmAlly.play('gm_hurt', false);
    }
}

function damageMbAlly(scene, amount) {
    if (!mbAlly || !mbAlly.active || mbAlly._state === 'DEAD' || mbAlly._state === 'NPC') return;
    if (mbAlly._state === 'DEFEND') return;
    mbAllyHp -= amount;
    if (mbAllyHp < 0) mbAllyHp = 0;
    mbAlly.setTint(0xff6666);
    scene.time.delayedCall(80, () => { if (mbAlly && mbAlly.active) mbAlly.clearTint(); });
    if (mbAllyHp <= 0) {
        mbAlly._state = 'DEAD';
        mbAlly.setVelocityX(0);
        mbAlly.play('mb_death', false);
        scene.time.delayedCall(2000, () => { if (mbAlly && mbAlly.active) mbAlly.destroy(); mbAlly = null; });
        return;
    }
    const milestone = (mbAlly._lastHurtMilestone !== undefined) ? mbAlly._lastHurtMilestone : MB_ALLY_MAX_HP;
    if (mbAllyHp <= milestone - 200) {
        mbAlly._lastHurtMilestone = milestone - 200;
        mbAlly._attackIndex = 0;
        mbAlly._state = 'FOLLOW';
        mbAlly.play('mb_hurt', false);
    }
}

/** Damage all recruited allies within range of a boss attack. */
function _hitAllies(scene, bx, by, range, amount) {
    const tryHit = (allySprite, dmgFn) => {
        if (!allySprite || !allySprite.active) return;
        const d = Phaser.Math.Distance.Between(allySprite.x, allySprite.y, bx, by);
        if (d <= range) dmgFn(scene, amount);
    };
    tryHit(ally, damageAlly);
    tryHit(fkAlly, damageFkAlly);
    tryHit(wkAlly, damageWkAlly);
    tryHit(gmAlly, damageGmAlly);
    tryHit(mbAlly, damageMbAlly);
}

function spawnEnemy(x, y) {
    const scene = this;
    destroyBosses();
    showBossHudSlotB(false, false);

    if (currentLevel === 2) {
        enemy = scene.matter.add.sprite(x, y, 'nb_sheet', null, {
            inertia: Infinity, mass: 7, label: 'enemy',
            shape: { type: 'rectangle', width: 46, height: 40, position: { x: 0, y: 10 } }
        });
        enemy.setDepth(9);
        enemy.setScale(1.45);
        enemy.kind = 'upper5';
        enemy.displayName = 'Upper 5';
        enemy.state = 'IDLE';
        enemy.hp = bossHpForLevel(2, ENEMY_MAX_HP * UPPER5_HP_MULT_L2_TO_L5);
        enemy.maxHp = enemy.hp;
        enemy.nextMeleeAt = scene.time.now + 2500;
        enemy.play('nb_idle');
        enemy.on('animationcomplete', (anim) => {
            if (!enemy || !enemy.active) return;
            if (anim.key === 'nb_attack') {
                if (enemy.state === 'ATTACK' || enemy.state === 'SWING') enemy.state = 'FOLLOW';
            }
            if (anim.key === 'nb_hurt' && enemy.state === 'HURT') {
                enemy.state = 'FOLLOW';
            }
            if (anim.key === 'nb_death') enemy.destroy();
        });

    } else if (currentLevel === 3) {
        // Upper 4 (Imp → Demon Boss) LEFT side
        enemy = scene.matter.add.sprite(x, y, 'imp_idle_sheet', null, {
            inertia: Infinity, mass: 4, label: 'enemy',
            restitution: 0, frictionStatic: 1, friction: 1,
            shape: { type: 'rectangle', width: 36, height: 40 }
        });
        enemy.setDepth(9);
        enemy.kind = 'upper4_imp';
        enemy.displayName = 'Upper 4 — Phase 1';
        enemy.state = 'IDLE';
        enemy.hp = bossHpForLevel(3, 300); enemy.maxHp = enemy.hp;
        enemy.phase = 1; enemy.phase2Spawned = false;
        enemy.nextMeleeAt = scene.time.now + 2200;
        enemy.play('imp_idle');
        enemy.on('animationcomplete', (anim) => {
            if (anim.key === 'imp_attack') {
                if (enemy && enemy.active && enemy.state === 'SWING') enemy.state = 'FOLLOW';
            }
            if (anim.key === 'imp_death') {
                const px = enemy ? enemy.x : x;
                const py = enemy ? enemy.y : y;
                if (enemy && enemy.active) enemy.destroy();
                enemy = scene.matter.add.sprite(px, py, 'db_idle_sheet', null, {
                    inertia: Infinity, mass: 9, label: 'enemy',
                    ignoreGravity: true,
                    shape: { type: 'rectangle', width: 86, height: 110 }
                });
                enemy.setDepth(9);
                enemy.kind = 'upper4_db';
                enemy.displayName = 'Upper 4 — Phase 2';
                enemy.phase = 2;
                refreshHpBars();
                enemy.state = 'IDLE_WAIT';
                enemy.hp = bossHpForLevel(3, 300); enemy.maxHp = enemy.hp;
                enemy.clearTint();
                enemy.nextMeleeAt = scene.time.now + 1500;
                enemy.play('db_idle');
                enemy.on('animationcomplete', (a2) => {
                    if (!enemy || !enemy.active) return;
                    if (a2.key === 'db_transition' && enemy.state === 'TRANSITION') enemy.state = 'FOLLOW';
                    if (a2.key === 'db_attack'     && enemy.state === 'SWING')      enemy.state = 'FOLLOW';
                    if (a2.key === 'db_hurt'        && enemy.state === 'HURT')       enemy.state = 'FOLLOW';
                    if (a2.key === 'db_death') {
                        if (enemy && enemy.active) enemy.destroy();
                        enemy = null;
                        if (!isAliveBoss(enemy) && !isAliveBoss(enemy2)) {
                            death = true;
                            trySpawnBossLoot(scene, player.x, player.y);
                        }
                    }
                });
                if (uiCamera) uiCamera.ignore([enemy]);
                applyEnemyMatterFilter();
            }
        });

        // Upper 3 (Boss Demon Slime) RIGHT side
        const u3x = x + 500;
        enemy2 = scene.matter.add.sprite(u3x, y - 20, 'ds3_idle_1', null, {
            inertia: Infinity, mass: 8, label: 'enemy',
            restitution: 0, frictionStatic: 1, friction: 1,
            shape: { type: 'rectangle', width: 56, height: 58 }
        });
        enemy2.setDepth(9);
        enemy2.kind = 'upper3';
        enemy2.displayName = 'Upper 3 — Phase 1';
        enemy2.phase = 1;
        enemy2.phase2 = false;
        enemy2.state = 'IDLE';
        enemy2.hp = bossHpForLevel(3, 400); enemy2.maxHp = enemy2.hp;
        enemy2.invulnerable = false;
        enemy2.setScale(1);
        enemy2.nextDecisionAt = scene.time.now + 800;
        enemy2._swingUntil = 0;
        enemy2._hurtUntil = 0;
        enemy2.play('ds3_idle');
        showBossHudSlotB(true, false);

    } else if (currentLevel === 4) {
        const upper2Y = y + 15;
        enemy = scene.matter.add.sprite(x, upper2Y, 'ds_idle_sheet', null, {
            inertia: Infinity, mass: 11, label: 'enemy',
            shape: { type: 'rectangle', width: 74, height: 106, position: { x: 0, y: 8 } }
        });
        enemy.setDepth(9);
        enemy.setScale(1.22);
        enemy.kind = 'upper2';
        enemy.displayName = 'Upper 2';
        enemy.state = 'IDLE';
        enemy.hp = bossHpForLevel(4, 500); enemy.maxHp = enemy.hp;
        enemy.isFlaming = false; enemy.didShout = false; enemy.invulnerable = false;
        enemy.nextDecisionAt = scene.time.now + 650;
        enemy.nextDefendAt = scene.time.now + Phaser.Math.Between(2200, 4200);
        enemy.attackIndex = 0;
        enemy.play('ds_idle');
        enemy.on('animationcomplete', (a) => {
            if (!enemy || !enemy.active) return;
            const atkKeys = new Set(['ds_atk1','ds_atk2','ds_atk3','ds_jumpatk','dsf_atk1','dsf_atk2','dsf_atk3','dsf_jumpatk']);
            if (atkKeys.has(a.key) && enemy.state === 'SWING') enemy.state = 'FOLLOW';
            if (a.key === 'ds_shout' && enemy.state === 'SHOUT') { enemy.isFlaming = true; enemy.state = 'FOLLOW'; }
            if ((a.key === 'ds_hurt' || a.key === 'dsf_hurt') && enemy.state === 'HURT') enemy.state = 'FOLLOW';
            if (a.key === 'ds_death') enemy.destroy();
        });

        const e2x = x + 500;
        enemy2 = scene.matter.add.sprite(e2x, y, 'e_idle_1', null, {
            inertia: Infinity, mass: 8, label: 'enemy',
            shape: { type: 'rectangle', width: 60, height: 90 }
        });
        enemy2.setDepth(10);
        enemy2.kind = 'upper1';
        enemy2.displayName = 'Upper 1';
        enemy2.state = 'IDLE';
        enemy2.hp = bossHpForLevel(4, 750); enemy2.maxHp = enemy2.hp;
        enemy2.invulnerable = false;
        enemy2.nextDecisionAt = scene.time.now + 700;
        enemy2.attackIndex = 0;
        enemy2.play('el_idle');
        showBossHudSlotB(true, true);

    } else if (currentLevel === 5) {
        // Shadow Stalker — Final Boss
        enemy = scene.matter.add.sprite(x, y, 'ss_idle_1', null, {
            inertia: Infinity, mass: 10, label: 'enemy',
            restitution: 0, frictionStatic: 1, friction: 1,
            shape: { type: 'rectangle', width: 52, height: 88 }
        });
        enemy.setDepth(10);
        enemy.kind = 'antagonist';
        enemy.displayName = 'Antagonist';
        enemy.state = 'IDLE';
        enemy.hp = bossHpForLevel(5, 1000); enemy.maxHp = enemy.hp;
        enemy.isElemental = false; enemy.didTransform = false; enemy.invulnerable = false;
        enemy.nextDecisionAt = scene.time.now + 800;
        enemy._swingUntil = 0; enemy._hurtUntil = 0; enemy.attackIndex = 0;
        enemy.play('ss_idle');
        showBossHudSlotB(false, false);

    } else {
        // Level 1: Upper 6 flying demon
        enemy = scene.matter.add.sprite(x, y, 'e_idle_sheet', null, {
            inertia: Infinity, mass: 5, label: 'enemy',
            shape: { type: 'rectangle', width: 50, height: 60 }
        });
        enemy.setDepth(9);
        enemy.kind = 'upper6';
        enemy.displayName = 'Upper 6 Enjal';
        enemy.state = 'SPAWN';
        enemy.hp = ENEMY_MAX_HP; enemy.maxHp = ENEMY_MAX_HP;
        enemy.nextProjectileAt = scene.time.now + Phaser.Math.Between(800, 1600);
        enemy.play('e_spawn');
        enemy.on('animationcomplete', (anim) => {
            if (anim.key === 'e_spawn') enemy.state = 'IDLE';
            if (anim.key === 'e_death') enemy.destroy();
        });
    }

    if (uiCamera) uiCamera.ignore([enemy]);
    if (uiCamera && enemy2) uiCamera.ignore([enemy2]);
    applyEnemyMatterFilter();
    return enemy;
}


function shootDemonProjectile(scene) {
    if (!enemy || !enemy.active || enemy.state === 'DEATH' || !player) return;

    setEnemyFacingTowardPlayer();

    const proj = scene.matter.add.image(enemy.x, enemy.y - 10, 'demon_proj', null, {
        ignoreGravity: true,
        frictionAir: 0,
        label: 'fireball',
        shape: { type: 'circle', radius: 12 }
    });
    if (proj.body) proj.body.label = 'fireball';
    setFireballMatterFilter(proj);
    proj.setDepth(9);

    const dir = player.x < enemy.x ? -1 : 1;
    const spd = 7;
    proj.setVelocity(dir * spd, 0);
    proj.setAngularVelocity(0.06);
    if (dir < 0) proj.setFlipX(true);

    if (uiCamera) uiCamera.ignore([proj]);

    scene.time.delayedCall(5500, () => { if (proj && proj.active) proj.destroy(); });
}

function throwStar(scene) {
    if (!player || !player.active) return;
    if (playerCombatLock === 'dead') return;
    if (kunaiCount <= 0) return;
    if (!canStartAction()) return;

    kunaiCount -= 1;
    playSfxKunaiThrow();
    const b = player.getBounds();
    const dir = player.flipX ? -1 : 1;
    const sx = b.centerX + dir * 20;
    const sy = b.centerY;
    const star = scene.matter.add.image(sx, sy, 'star', null, {
        ignoreGravity: true, frictionAir: 0, label: 'star',
        shape: { type: 'circle', radius: 18 }
    });
    star.setScale(1);
    star.setDepth(11);
    if (star.body) star.body.label = 'star';
    setStarMatterFilter(star);
    star.setAngle(dir === 1 ? -90 : 90);
    if (star.body) {
        star.body.angle = (dir === 1 ? -90 : 90) * (Math.PI / 180);
    }
    star.setVelocityX(dir * 14);

    if (uiCamera) uiCamera.ignore([star]);

    scene.time.delayedCall(2200, () => { if (star && star.active) star.destroy(); });
}

function advanceLevel(scene) {
    if (scene && scene._winEndScheduled) return;
    const nextLevel = currentLevel + 1;
    const start = levelStarts.find(l => l.level === nextLevel);
    if (!start) return;

    currentLevel = nextLevel;

    player.setPosition(start.x, start.y);
    player.setVelocity(0, 0);
    playerCombatLock = null;
    player._rollDir = 0;
    playerHp = PLAYER_MAX_HP;
    doubleJumpReady = true;
    airJumpsUsed = 0;
    wasGrounded = true;
    playerGroundContacts = 0;
    player.play('idle_anim');
    restorePlayerPhysicsDefaults(player);

    applyCameraBounds(currentLevel);

    destroyBosses();
    bossDropSpawned = false;
    spawnEnemy.call(scene, start.enemyX, start.enemyY);

    death = false;
    applyPlayerMatterFilter(playerMaskAll());

    if (ally && ally.active && allyRecruited) {
        ally.setPosition(start.x + 60, start.y);
        ally.setVelocity(0, 0);
        ally._state = 'FOLLOW';
    }

    if (fkAlly && fkAlly.active && fkAllyRecruited) {
        fkAlly.setPosition(start.x + 80, start.y);
        fkAlly.setVelocity(0, 0);
        fkAlly._state = 'FOLLOW';
    }

    if (wkAlly && wkAlly.active && wkAllyRecruited) {
        wkAlly.setPosition(start.x + 100, start.y);
        wkAlly.setVelocity(0, 0);
        wkAlly._state = 'FOLLOW';
    }

    if (gmAlly && gmAlly.active && gmAllyRecruited) {
        gmAlly.setPosition(start.x + 120, start.y);
        gmAlly.setVelocity(0, 0);
        gmAlly._state = 'FOLLOW';
    }

    if (mbAlly && mbAlly.active && mbAllyRecruited) {
        mbAlly.setPosition(start.x + 140, start.y);
        mbAlly.setVelocity(0, 0);
        mbAlly._state = 'FOLLOW';
    }
}

function isGroundedPlayer() {
    if (!player || !player.body) return false;
    if (player.body.velocity.y < -2) return false;
    return playerGroundContacts > 0;
}
function canStartAction() {
    return !playerCombatLock || playerCombatLock === 'block';
}

function refreshHpBars() {
    if (!playerHpBarFill || !enemyHpBarFill || !enemyHpBarBg) return;
    const pw = Math.max(0, 200 * (playerHp / PLAYER_MAX_HP));
    playerHpBarFill.setSize(pw, 8);

    if (ultBarFill && ultBarBg) {
        const u = Math.max(0, 200 * (ultimateCharge / 100));
        ultBarFill.setSize(u, 6);
        ultBarFill.setPosition(ultBarBg.x, ultBarBg.y);
    }
    if (ultStateLabel) {
        if (ultimateCharge >= 100) {
            ultStateLabel.setText('Ultimate ready! (V)');
        } else {
            ultStateLabel.setText(`Ult  ${Math.floor(ultimateCharge)}%  (V locked)`);
        }
    }
    if (hudItemsLine) {
        const now = gameSceneRef && gameSceneRef.time ? gameSceneRef.time.now : 0;
        const zCd = formatCd(getCooldownRemaining(now, 'z'));
        const xCd = formatCd(getCooldownRemaining(now, 'x'));
        const cCd = formatCd(getCooldownRemaining(now, 'c'));
        hudItemsLine.setText(
            `Kunai: ${kunaiCount}  |  Potions: ${potionCount}  (F) heal ${POTION_HEAL} HP\n` +
            `Z: ${zCd}  |  X: ${xCd}  |  C: ${cCd}`
        );
    }

    if (enemy && enemy.active && enemy.hp != null) {
        const ratio = enemy.hp / (enemy.maxHp || ENEMY_MAX_HP);
        const ew = Math.max(0, enemyHpBarBg.width * ratio);
        enemyHpBarFill.setSize(ew, enemyHpBarBg.height);
        enemyHpBarFill.setPosition(enemyHpBarBg.x, enemyHpBarBg.y);
        if (enemyHpLabel) {
            const nm = enemy.displayName || 'Demon';
            enemyHpLabel.setText(`${nm}  ${Math.ceil(enemy.hp)}/${enemy.maxHp}`);
        }
        if (enemyIcon && enemy.kind === 'antagonist') {
            enemyIcon.setVisible(true);
            const iconKey = enemy.isElemental ? 'ss_e_icon' : 'ss_icon';
            if (enemyIcon.texture.key !== iconKey) enemyIcon.setTexture(iconKey);
        } else if (enemyIcon) {
            enemyIcon.setVisible(false);
        }
    } else {
        enemyHpBarFill.setSize(0, enemyHpBarBg.height);
        enemyHpBarFill.setPosition(enemyHpBarBg.x, enemyHpBarBg.y);
        if (enemyHpLabel) enemyHpLabel.setText('Demon');
        if (enemyIcon) enemyIcon.setVisible(false);
    }

    if (enemy2HpBarBg && enemy2HpBarFill && enemy2HpLabel && enemy2HpBarBg.visible) {
        if (enemy2 && enemy2.active && enemy2.hp != null) {
            const ratio2 = enemy2.hp / (enemy2.maxHp || 1);
            const ew2 = Math.max(0, enemy2HpBarBg.width * ratio2);
            enemy2HpBarFill.setSize(ew2, enemy2HpBarBg.height);
            enemy2HpBarFill.setPosition(enemy2HpBarBg.x, enemy2HpBarBg.y);
            enemy2HpLabel.setText(`${enemy2.displayName || 'Boss'}  ${Math.ceil(enemy2.hp)}/${enemy2.maxHp}`);
        } else {
            enemy2HpBarFill.setSize(0, enemy2HpBarBg.height);
            enemy2HpBarFill.setPosition(enemy2HpBarBg.x, enemy2HpBarBg.y);
            enemy2HpLabel.setText('');
        }
    }

    if (allyHpBarBg && allyRecruited) {
        allyHpBarBg.setVisible(true);
        allyHpBarFill.setVisible(true);
        allyHpLabel.setVisible(true);
        allyIcon.setVisible(true);
        const ar = Math.max(0, allyHp / ALLY_MAX_HP);
        allyHpBarFill.setSize(Math.max(0, 160 * ar), 10);
        allyHpBarFill.setPosition(allyHpBarBg.x, allyHpBarBg.y);
    }

    if (fkAllyHpBarBg && fkAllyRecruited) {
        fkAllyHpBarBg.setVisible(true);
        fkAllyHpBarFill.setVisible(true);
        fkAllyHpLabel.setVisible(true);
        fkAllyIcon.setVisible(true);
        const fr = Math.max(0, fkAllyHp / FK_ALLY_MAX_HP);
        fkAllyHpBarFill.setSize(Math.max(0, 160 * fr), 10);
        fkAllyHpBarFill.setPosition(fkAllyHpBarBg.x, fkAllyHpBarBg.y);
    }

    if (wkAllyHpBarBg && wkAllyRecruited) {
        wkAllyHpBarBg.setVisible(true);
        wkAllyHpBarFill.setVisible(true);
        wkAllyHpLabel.setVisible(true);
        wkAllyIcon.setVisible(true);
        const wr = Math.max(0, wkAllyHp / WK_ALLY_MAX_HP);
        wkAllyHpBarFill.setSize(Math.max(0, 160 * wr), 10);
        wkAllyHpBarFill.setPosition(wkAllyHpBarBg.x, wkAllyHpBarBg.y);
    }

    if (gmAllyHpBarBg && gmAllyRecruited) {
        gmAllyHpBarBg.setVisible(true);
        gmAllyHpBarFill.setVisible(true);
        gmAllyHpLabel.setVisible(true);
        gmAllyIcon.setVisible(true);
        const gr = Math.max(0, gmAllyHp / GM_ALLY_MAX_HP);
        gmAllyHpBarFill.setSize(Math.max(0, 160 * gr), 10);
        gmAllyHpBarFill.setPosition(gmAllyHpBarBg.x, gmAllyHpBarBg.y);
    }

    if (mbAllyHpBarBg && mbAllyRecruited) {
        mbAllyHpBarBg.setVisible(true);
        mbAllyHpBarFill.setVisible(true);
        mbAllyHpLabel.setVisible(true);
        mbAllyIcon.setVisible(true);
        const mr = Math.max(0, mbAllyHp / MB_ALLY_MAX_HP);
        mbAllyHpBarFill.setSize(Math.max(0, 160 * mr), 10);
        mbAllyHpBarFill.setPosition(mbAllyHpBarBg.x, mbAllyHpBarBg.y);
    }
}

function startLightningDash(scene) {
    if (!canStartAction()) return;
    playerCombatLock = 'ldash';
    const face = player.flipX ? -1 : 1;
    player.setVelocityX(face * 13);
    player.setVelocityY(player.body.velocity.y * 0.35);
    player.play('ldash_anim', false);
}

function updateGame(scene) {
    if (!player || !player.active) return;

    if (isGameOver) {
        if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
            gameOverRectObj = null;
            gameOverTextObj = null;
            scene.scene.start('StartScene');
        }
        return;
    }

    const preAnim = player.anims.currentAnim;
    const preKey = preAnim && preAnim.key;
    syncPlayerAttackLockWithMeleeAnim(preKey);

    const keys = scene.keys;
    const now = scene.time.now;
    const speed = 5;
    const vy = player.body.velocity.y;
    const grounded = isGroundedPlayer();

    if (grounded && !wasGrounded) {
        airJumpsUsed = 0;
        doubleJumpReady = true;
    }
    wasGrounded = grounded;

    const moveLeft = keys.a.isDown;
    const moveRight = keys.d.isDown;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(keys.w);
    const zPressed = Phaser.Input.Keyboard.JustDown(keys.z);
    const xPressed = Phaser.Input.Keyboard.JustDown(keys.x);
    const cPressed = Phaser.Input.Keyboard.JustDown(keys.c);
    const vPressed = Phaser.Input.Keyboard.JustDown(keys.v);

    if (playerCombatLock !== 'dead') {
        const ca = player.anims.currentAnim;
        const ak = ca && ca.key;
        if (ak === 'dash_anim') {
            const face = player.flipX ? -1 : 1;
            player.setVelocityX(face * 9);
        } else if (ak === 'ldash_anim') {
            const face = player.flipX ? -1 : 1;
            player.setVelocityX(face * 13);
        } else if (ak === 'roll_anim') {
            const d = player._rollDir || (player.flipX ? -1 : 1);
            if (player.body) {
                player.body.friction = 0;
                player.body.frictionAir = 0.01;
            }
            player.setVelocityX(d * 12.5);
        }
    }

    if (playerCombatLock === 'dead') {
        refreshHpBars();
        updateEnemyHudOnly(scene);
        return;
    }

    if (keys.i.isDown && (!playerCombatLock || playerCombatLock === 'block')) {
        playerCombatLock = 'block';
        player.setVelocityX(0);
        player.play('block_anim', true);
    } else {
        if (playerCombatLock === 'block') {
            playerCombatLock = null;
        }

        if (Phaser.Input.Keyboard.JustDown(keys.f)) {
            if (potionCount > 0 && playerHp < PLAYER_MAX_HP) {
                potionCount -= 1;
                playerHp = Math.min(PLAYER_MAX_HP, playerHp + POTION_HEAL);
                playSfxPotion();
            } else {
                hudText.setTint(0xff6666);
                scene.time.delayedCall(120, () => hudText.clearTint());
            }
        }

        if (Phaser.Input.Keyboard.JustDown(keys.o) && canStartAction() && kunaiCount > 0) {
            throwStar(scene);
        }

        if (Phaser.Input.Keyboard.JustDown(spaceKey) && canStartAction()) {
            playerCombatLock = 'roll';
            const rollDir = (moveLeft && !moveRight) ? -1 : (moveRight && !moveLeft) ? 1 : (player.flipX ? -1 : 1);
            player._rollDir = rollDir;
            if (player.body) {
                player.body.friction = 0;
                player.body.frictionAir = 0.008;
            }
            applyPlayerMatterFilter(playerMaskRoll());
            player.setVelocityX(rollDir * 11.5);
            player.setVelocityY(Math.min(vy, 3) * 0.25);
            player.play('roll_anim', false);
        }

        if (Phaser.Input.Keyboard.JustDown(keys.t) && canStartAction()) {
            startLightningDash(scene);
        }

        if (Phaser.Input.Keyboard.JustDown(keys.q) && canStartAction()) {
            const now = scene.time.now;
            const isDouble = scene.lastQDownMs > 0 && (now - scene.lastQDownMs) < 420;
            if (isDouble) {
                scene.lastQDownMs = 0;
                startLightningDash(scene);
            } else {
                scene.lastQDownMs = now;
                playerCombatLock = 'dash';
                const face = player.flipX ? -1 : 1;
                player.setVelocityX(face * 9);
                player.setVelocityY(Math.min(player.body.velocity.y, 2));
                player.play('dash_anim', false);
            }
        }

        const comboDamage = [4, 4, 12];

        if (canStartAction()) {
            if (
                (zPressed && !isMoveReady(now, 'z')) ||
                (xPressed && !isMoveReady(now, 'x')) ||
                (cPressed && !isMoveReady(now, 'c'))
            ) {
                if (hudItemsLine) {
                    hudItemsLine.setTint(0xff6666);
                    scene.time.delayedCall(120, () => hudItemsLine && hudItemsLine.clearTint());
                }
            }
            if (zPressed && isMoveReady(now, 'z')) {
                playerCombatLock = 'attack';
                if (!grounded) {
                    playSfxSlice();
                    player.setVelocityX(0);
                    player.play('air_atk_anim', false);
                    scheduleMeleeHit(scene, 'air_atk_anim', 120, DAMAGE_AIR);
                } else {
                    playSfxSlice();
                    player.setVelocityX(0);
                    player.play('atk1_anim', false);
                    scheduleMeleeHit(scene, 'atk1_anim', 140, DAMAGE_ATK1, { skipUltCharge: true, ultGainOverride: 1 });
                }
                startMoveCooldown(now, 'z', CD_Z_MS);
            } else if (xPressed && grounded && isMoveReady(now, 'x')) {
                playerCombatLock = 'attack';
                playSfxSlice();
                player.setVelocityX(0);
                player.play('atk2_anim', false);
                scene.time.delayedCall(200, () => {
                    scheduleMeleeHit(scene, 'atk2_anim', 0, comboDamage[0]);
                });
                scene.time.delayedCall(400, () => {
                    scheduleMeleeHit(scene, 'atk2_anim', 0, comboDamage[1]);
                });
                startMoveCooldown(now, 'x', CD_X_MS);
            } else if (cPressed && grounded && isMoveReady(now, 'c')) {
                playerCombatLock = 'attack';
                playSfxSlice();
                player.setVelocityX(0);
                player.play('atk3_anim', false);
                scheduleMeleeHit(scene, 'atk3_anim', 320, comboDamage[0]);
                scene.time.delayedCall(300, () => {
                    scheduleMeleeHit(scene, 'atk3_anim', 0, comboDamage[0]);
                    playSfxSlice();
                });
                scene.time.delayedCall(600, () => {
                    scheduleMeleeHit(scene, 'atk3_anim', 0, comboDamage[1]);
                    playSfxSlice();
                });
                scene.time.delayedCall(2000, () => {
                    scheduleMeleeHit(scene, 'atk3_anim', 0, comboDamage[2]);
                    playSfxSlice();
                });
                startMoveCooldown(now, 'c', CD_C_MS);
            } else if (vPressed && grounded) {
                if (ultimateCharge < 100) {
                    ultStateLabel && ultStateLabel.setTint(0xff6666);
                    scene.time.delayedCall(100, () => ultStateLabel && ultStateLabel.clearTint());
                } else {
                    ultimateCharge = 0;
                    playerCombatLock = 'attack';
                    player.setVelocityX(0);
                    playSfxSuperAttack();
                    player.play('ult_anim', false);
                    scheduleUltimateFury(scene);
                }
            }
        }

        const lockedMove = playerCombatLock && playerCombatLock !== 'block';
        if (!lockedMove) {
            if (moveLeft) {
                player.setVelocityX(-speed);
                player.flipX = true;
            } else if (moveRight) {
                player.setVelocityX(speed);
                player.flipX = false;
            } else {
                player.setVelocityX(0);
            }

            if (jumpPressed) {
                if (grounded) {
                    player.setVelocityY(-8.5);
                    airJumpsUsed = 0;
                    doubleJumpReady = true;
                    player.play('jump_anim', false);
                } else if (airJumpsUsed < MAX_AIR_JUMPS && doubleJumpReady) {
                    airJumpsUsed++;
                    doubleJumpReady = false;
                    player.setVelocityY(-7.2);
                    player.play('jump_anim', false);
                }
            }

            if (grounded) {
                if (moveLeft || moveRight) {
                    player.play('run_anim', true);
                } else {
                    player.play('idle_anim', true);
                }
            } else {
                const curKey = player.anims.currentAnim && player.anims.currentAnim.key;
                const atkKeys = new Set(['atk1_anim', 'atk2_anim', 'atk3_anim', 'ult_anim', 'air_atk_anim', 'roll_anim', 'dash_anim', 'ldash_anim']);
                if (!atkKeys.has(curKey)) {
                    player.play('jump_anim' , true);
                }
            }
        }
    }

    {
        const cx = Phaser.Math.Clamp(player.x, MAP_MIN_X, MAP_MAX_X);
        if (cx !== player.x) {
            player.setPosition(cx, player.y);
            player.setVelocityX(0);
        }
    }

    updateDemon(scene);

    const clampEnemy = (e) => {
        if (!e || !e.active || e.state === 'DEATH') return;
        if (e.body && Math.abs(e.body.velocity.x) > 6) {
            e.setVelocityX(Math.sign(e.body.velocity.x) * 6);
        }
        const ex = Phaser.Math.Clamp(e.x, MAP_MIN_X + 20, MAP_MAX_X - 20);
        if (ex !== e.x) { e.setX(ex); e.setVelocityX(0); }
    };
    clampEnemy(enemy);
    clampEnemy(enemy2);

    updateAlly(scene);
    updateFkAlly(scene);
    updateWkAlly(scene);
    updateGmAlly(scene);
    updateMbAlly(scene);

    const isNearDoor = player.x >= DOOR_X;
    if (death && isNearDoor && Phaser.Input.Keyboard.JustDown(enterKey)) {
        if (!scene._winEndScheduled) advanceLevel(scene);
    }

    refreshHpBars();
    updateEnemyHudOnly(scene);
}

function updateEnemyHudOnly(scene) {
    const isNearDoor = player.x >= DOOR_X;
    const npcState = (enemy && enemy.active) ? enemy.state : 'DEAD';
    const doorState = isNearDoor ? (death ? 'OPEN  [E]' : 'LOCKED') : 'NO';

    hudText.setText(
        `LEVEL: ${currentLevel}  |  NPC: ${npcState}\n` +
        `${playerName}  |  DOOR: ${doorState}\n` +
        `ULT ${Math.floor(ultimateCharge)}%  |  Kunai ${kunaiCount}  |  Potions ${potionCount}`
    );
}

function updateDemon(scene) {
    if (enemy && enemy.active) {
        if      (enemy.kind === 'upper5')      updateUpper5(scene);
        else if (enemy.kind === 'upper4_imp')  updateUpper4Imp(scene);
        else if (enemy.kind === 'upper4_db')   updateUpper4DemonBoss(scene);
        else if (enemy.kind === 'upper2')      updateUpper2Samurai(scene);
        else if (enemy.kind === 'antagonist')  updateAntagonist(scene);
        else                                   updateUpper6(scene);
    }
    if (enemy2 && enemy2.active) {
        if      (enemy2.kind === 'upper1') updateUpper1Ronin(scene);
        else if (enemy2.kind === 'upper3') updateUpper3SlimeBoss(scene);
    }
}

function updateUpper6(scene) {
    if (!enemy || !enemy.active) return;

    const tgt = getClosestTarget(enemy);
    const dist = Phaser.Math.Distance.Between(tgt.x, tgt.y, enemy.x, enemy.y);
    setEnemyFacingTowardPlayer();

    const distToPlayer = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
    const canShoot = enemy.state !== 'DEATH' && enemy.state !== 'SPAWN' &&
        distToPlayer <= DEMON_SHOOT_RANGE &&
        scene.time.now >= enemy.nextProjectileAt;

    if (canShoot) {
        shootDemonProjectile(scene);
        enemy.nextProjectileAt = scene.time.now + Phaser.Math.Between(DEMON_SHOOT_COOLDOWN_MIN, DEMON_SHOOT_COOLDOWN_MAX);
    }

    switch (enemy.state) {
        case 'SPAWN':
            enemy.setVelocityX(0);
            break;
        case 'IDLE':
            enemy.play('e_idle', true);
            enemy.setVelocityX(0);
            if (dist < 620) enemy.state = 'FOLLOW';
            break;
        case 'FOLLOW': {
            enemy.play('e_idle', true);
            const dir = tgt.x < enemy.x ? -1 : 1;
            enemy.setVelocityX(dir * 2.2);
            if (dist < 110) enemy.state = 'ATTACK';
            if (dist > 720) enemy.state = 'IDLE';
            break;
        }
        case 'ATTACK':
            enemy.setVelocityX(0);
            enemy.play('e_attack', true);
            if (dist > 160) enemy.state = 'FOLLOW';
            break;
        case 'DEATH':
            enemy.setStatic(true);
            enemy.play('e_death', true);
            break;
    }
}

function updateUpper5(scene) {
    if (!enemy || !enemy.active || !player) return;
    const tgt = getClosestTarget(enemy);
    const dist = Phaser.Math.Distance.Between(tgt.x, tgt.y, enemy.x, enemy.y);
    setEnemyFacingTowardPlayer();

    switch (enemy.state) {
        case 'IDLE':
            enemy.play('nb_idle', true);
            enemy.setVelocityX(0);
            if (dist < 520) enemy.state = 'FOLLOW';
            break;
        case 'FOLLOW': {
            const dir = tgt.x < enemy.x ? -1 : 1;
            enemy.play('nb_run', true);
            enemy.setVelocityX(dir * UPPER5_FOLLOW_SPEED);
            if (dist < 70) enemy.state = 'ATTACK';
            if (dist > 700) enemy.state = 'IDLE';
            break;
        }
        case 'HURT': {
            const now = scene.time.now;
            enemy.setVelocityX(0);
            if (now >= (enemy._hurtUntil || 0)) {
                enemy.state = dist < 70 ? 'ATTACK' : 'FOLLOW';
            } else {
                enemy.play('nb_hurt', true);
            }
            break;
        }
        case 'ATTACK': {
            const dir = tgt.x < enemy.x ? -1 : 1;
            enemy.setVelocityX(0);
            if (dist > 70) {
                enemy.state = 'FOLLOW';
                break;
            }
            const now = scene.time.now;
            if (enemy.nextMeleeAt == null) enemy.nextMeleeAt = now + 1200;
            if (enemy.state === 'SWING') break;
            if (now < enemy.nextMeleeAt) {
                enemy.play('nb_idle', true);
                break;
            }
            if (dist > UPPER5_MELEE_RANGE) {
                enemy.state = 'FOLLOW';
                break;
            }
            enemy.nextMeleeAt = now + 1600;
            enemy.state = 'SWING';
            enemy._swingUntil = now + 750;
            enemy.setTint(0xff8800);
            scene.time.delayedCall(180, () => { if (enemy && enemy.active) enemy.clearTint(); });
            enemy.play('nb_attack', false);
            enemy.setVelocityX(dir * 1.6);
            scene.time.delayedCall(220, () => {
                if (enemy && enemy.active) enemy.setVelocityX(0);
            });
            scheduleBossMeleeHit(scene, enemy, 340, bossDmgForLevel(2, DAMAGE_UPPER5_MELEE), 62, true);
            break;
        }
        case 'SWING':
            enemy.setVelocityX(0);
            if (scene.time.now >= (enemy._swingUntil || 0)) enemy.state = 'FOLLOW';
            break;
        case 'DEATH':
            enemy.setStatic(true);
            enemy.play('nb_death', true);
            break;
    }
}

function updateUpper4Imp(scene) {
    if (!enemy || !enemy.active || !player) return;
    const tgt = getClosestTarget(enemy);
    const dist = Phaser.Math.Distance.Between(tgt.x, tgt.y, enemy.x, enemy.y);

    if (enemy.state !== 'DEATH') {
        const wantFlip = tgt.x < enemy.x;
        if (enemy._lastFlip !== wantFlip) {
            enemy._lastFlip = wantFlip;
            enemy.flipX = wantFlip;
        }
    }

    switch (enemy.state) {
        case 'IDLE':
            enemy.play('imp_idle', true);
            enemy.setVelocityX(0);
            if (dist < 420) enemy.state = 'FOLLOW';
            break;
        case 'FOLLOW': {
            enemy.play('imp_move', true);
            const dir = tgt.x < enemy.x ? -1 : 1;
            enemy.setVelocityX(dir * 2.6);
            if (dist < 95) enemy.state = 'ATTACK';
            if (dist > 520) enemy.state = 'IDLE';
            break;
        }
        case 'HURT':
            enemy.setVelocityX(0);
            break;
        case 'ATTACK': {
            enemy.setVelocityX(0);
            const now = scene.time.now;
            if (enemy.nextMeleeAt == null) enemy.nextMeleeAt = now;
            if (now < enemy.nextMeleeAt) {
                enemy.play('imp_idle', true);
                break;
            }
            enemy.nextMeleeAt = now + 1500;
            enemy.state = 'SWING';
            enemy._swingUntil = now + 700;
            enemy.setTint(0xff8800);
            scene.time.delayedCall(180, () => { if (enemy && enemy.active) enemy.clearTint(); });
            enemy.play('imp_attack', false);
            const lungeDir = player.x < enemy.x ? -1 : 1;
            enemy.setVelocityX(lungeDir * 3.5);
            scene.time.delayedCall(200, () => { if (enemy && enemy.active) enemy.setVelocityX(0); });
            scheduleBossMeleeHit(scene, enemy, 280, bossDmgForLevel(3, 14), 52, true);
            break;
        }
        case 'SWING':
            enemy.setVelocityX(0);
            if (scene.time.now >= (enemy._swingUntil || 0)) enemy.state = 'FOLLOW';
            break;
        case 'DEATH':
            enemy.setStatic(true);
            if (!enemy.anims.currentAnim || enemy.anims.currentAnim.key !== 'imp_death') {
                enemy.play('imp_death', false);
            }
            break;
    }
}

function updateUpper4DemonBoss(scene) {
    if (!enemy || !enemy.active || !player) return;
    const tgt = getClosestTarget(enemy);
    const dist = Phaser.Math.Distance.Between(tgt.x, tgt.y, enemy.x, enemy.y);
    setEnemyFacingTowardPlayer();

    switch (enemy.state) {
        case 'IDLE_WAIT':
            enemy.play('db_idle', true);
            enemy.setVelocityX(0);
            enemy.setVelocityY(0);
            if (enemy.x < MAP_MIN_X + 20) enemy.setX(MAP_MIN_X + 20);
            if (enemy.x > MAP_MAX_X - 20) enemy.setX(MAP_MAX_X - 20);
            if (scene.time.now >= enemy.nextMeleeAt) {
                enemy.state = 'TRANSITION';
                enemy.play('db_transition', false);
            }
            break;
        case 'TRANSITION':
            enemy.setVelocityX(0);
            enemy.setVelocityY(0);
            if (enemy.x < MAP_MIN_X + 20) enemy.setX(MAP_MIN_X + 20);
            if (enemy.x > MAP_MAX_X - 20) enemy.setX(MAP_MAX_X - 20);
            break;
        case 'IDLE':
            enemy.play('db_idle', true);
            enemy.setVelocityX(0);
            enemy.setVelocityY(0);
            if (enemy.x < MAP_MIN_X + 20) enemy.setX(MAP_MIN_X + 20);
            if (enemy.x > MAP_MAX_X - 20) enemy.setX(MAP_MAX_X - 20);
            if (dist < 560) {
                enemy.state = 'TRANSITION';
                enemy.play('db_transition', false);
            }
            break;
        case 'FOLLOW': {
            enemy.play('db_fly', true);
            const dir = tgt.x < enemy.x ? -1 : 1;
            enemy.setVelocityX(dir * 2.2);
            enemy.setVelocityY(0);
            if (enemy.x < MAP_MIN_X + 20) { enemy.setX(MAP_MIN_X + 20); enemy.setVelocityX(0); }
            if (enemy.x > MAP_MAX_X - 20) { enemy.setX(MAP_MAX_X - 20); enemy.setVelocityX(0); }
            if (dist < 90) enemy.state = 'ATTACK';
            if (dist > 720) enemy.state = 'IDLE';
            break;
        }
        case 'HURT':
            enemy.setVelocityX(0);
            enemy.setVelocityY(0);
            enemy.play('db_hurt', true);
            break;
        case 'ATTACK': {
            enemy.setVelocityX(0);
            enemy.setVelocityY(0);
            const now = scene.time.now;
            if (enemy.nextMeleeAt == null) enemy.nextMeleeAt = now;
            if (now < enemy.nextMeleeAt) {
                enemy.play('db_fly', true);
                if (dist > 90) enemy.state = 'FOLLOW';
                break;
            }
            enemy.nextMeleeAt = now + 1700;
            enemy.state = 'SWING';
            enemy._swingUntil = now + 900;
            enemy.setTint(0xff8800);
            scene.time.delayedCall(180, () => { if (enemy && enemy.active) enemy.clearTint(); });
            enemy.play('db_attack', false);
            scheduleBossMeleeHit(scene, enemy, 420, bossDmgForLevel(3, 20), 58, true);
            break;
        }
        case 'SWING':
            enemy.setVelocityX(0);
            enemy.setVelocityY(0);
            if (scene.time.now >= (enemy._swingUntil || 0)) enemy.state = 'FOLLOW';
            break;
        case 'DEATH':
            enemy.setStatic(true);
            if (!enemy.anims.currentAnim || enemy.anims.currentAnim.key !== 'db_death') {
                enemy.play('db_death', false);
            }
            break;
    }
}

function updateUpper2Samurai(scene) {
    if (!enemy || !enemy.active || !player) return;
    const tgt = getClosestTarget(enemy);
    const dist = Phaser.Math.Distance.Between(tgt.x, tgt.y, enemy.x, enemy.y);
    setEnemyFacingTowardPlayer();

    const idleKey = enemy.isFlaming ? 'dsf_idle' : 'ds_idle';
    const runKey = enemy.isFlaming ? 'dsf_run' : 'ds_run';
    const atkKeys = enemy.isFlaming ? ['dsf_atk1', 'dsf_atk2', 'dsf_atk3', 'dsf_jumpatk'] : ['ds_atk1', 'ds_atk2', 'ds_atk3', 'ds_jumpatk'];

    if (enemy.state !== 'DEATH' && enemy.state !== 'SHOUT' && enemy.state !== 'DEFEND' &&
        enemy.state !== 'SWING' && enemy.state !== 'HURT' && enemy.state !== 'ATTACK' &&
        scene.time.now >= (enemy.nextDefendAt || 0)) {
        enemy.state = 'DEFEND';
        enemy.invulnerable = true;
        enemy.defendUntil = scene.time.now + 1800;
        enemy.nextDefendAt = scene.time.now + Phaser.Math.Between(3200, 5200);
    }

    switch (enemy.state) {
        case 'IDLE':
            enemy.play(idleKey, true);
            enemy.setVelocityX(0);
            if (dist < 620) enemy.state = 'FOLLOW';
            break;
        case 'FOLLOW': {
            enemy.play(runKey, true);
            const dir = tgt.x < enemy.x ? -1 : 1;
            enemy.setVelocityX(dir * 2.2);
            if (dist < 100) enemy.state = 'ATTACK';
            if (dist > 740) enemy.state = 'IDLE';
            break;
        }
        case 'DEFEND':
            enemy.setVelocityX(0);
            enemy.play('ds_defend', true);
            if (scene.time.now >= (enemy.defendUntil || 0)) {
                enemy.invulnerable = false;
                enemy.nextDefendAt = scene.time.now + Phaser.Math.Between(5000, 8000);
                enemy.state = 'FOLLOW';
            }
            break;
        case 'HURT':
            enemy.setVelocityX(0);
            enemy.play(enemy.isFlaming ? 'dsf_hurt' : 'ds_hurt', true);
            break;
        case 'SHOUT':
            enemy.setVelocityX(0);
            enemy.play('ds_shout', true);
            break;
        case 'ATTACK': {
            enemy.setVelocityX(0);
            const now = scene.time.now;
            if (enemy.nextDecisionAt == null) enemy.nextDecisionAt = now;
            if (now < enemy.nextDecisionAt) {
                enemy.play(idleKey, true);
                break;
            }
            enemy.nextDecisionAt = now + 1500;
            enemy.state = 'SWING';
            const key = atkKeys[enemy.attackIndex % atkKeys.length];
            enemy.attackIndex = (enemy.attackIndex + 1) % atkKeys.length;
            const hitDelays = { ds_atk1: 200, ds_atk2: 260, ds_atk3: 340, ds_jumpatk: 380, dsf_atk1: 200, dsf_atk2: 260, dsf_atk3: 340, dsf_jumpatk: 380 };
            const hitRanges = { ds_atk1: 58, ds_atk2: 62, ds_atk3: 68, ds_jumpatk: 72, dsf_atk1: 58, dsf_atk2: 62, dsf_atk3: 68, dsf_jumpatk: 72 };
            const baseDmg = enemy.isFlaming ? 24 : 18;
            enemy._swingUntil = now + 700;
            enemy.play(key, false);
            scheduleBossMeleeHit(scene, enemy, hitDelays[key] || 260, bossDmgForLevel(4, baseDmg), hitRanges[key] || 62, true);
            break;
        }
        case 'SWING':
            enemy.setVelocityX(0);
            if (scene.time.now >= (enemy._swingUntil || 0)) enemy.state = 'FOLLOW';
            break;
        case 'DEATH':
            enemy.setStatic(true);
            enemy.play('ds_death', true);
            break;
    }
}

// ── Upper 1 (level 4) — death animation + loot; advance to level 5 via door ───
function updateUpper1Ronin(scene) {
    if (!enemy2 || !enemy2.active || !player) return;

    const now = scene.time.now;
    const tgt = getClosestTarget(enemy2);

    if (enemy2.state !== 'DEATH') {
        enemy2.setFlipX(tgt.x < enemy2.x);
    }

    const dist = Phaser.Math.Distance.Between(tgt.x, tgt.y, enemy2.x, enemy2.y);

    if (enemy2.hp != null && enemy2.hp <= 0 && enemy2.state !== 'DEATH') {
        enemy2.state = 'DEATH';
        enemy2.setVelocityX(0);
        enemy2.setStatic(true);
    }

    if (enemy2.state === 'DEATH') {
        if (!enemy2._finishingDeath) {
            enemy2._finishingDeath = true;
            enemy2.setVelocityX(0);
            enemy2.play('el_back2human', false);
            const b2hMs = (12 / 14) * 1000 + 120;
            const cenMs = (20 / 16) * 1000 + 200;

            scene.time.delayedCall(b2hMs, () => {
                const ex = enemy2 ? enemy2.x : player.x;
                const ey = enemy2 ? enemy2.y : player.y;
                if (enemy2 && enemy2.active) {
                    enemy2.destroy();
                    enemy2 = null;
                }

                const fx = scene.add.sprite(ex, ey, 'u1_death_cen_1').setDepth(12);
                if (uiCamera) uiCamera.ignore([fx]);
                fx.play('u1_death_cen', false);

                scene.time.delayedCall(cenMs, () => {
                    if (fx && fx.active) fx.destroy();
                    if (!isAliveBoss(enemy) && !isAliveBoss(enemy2)) {
                        death = true;
                        trySpawnBossLoot(scene, ex, ey);
                    }
                });
            });
        }
        return;
    }

    switch (enemy2.state) {
        case 'IDLE':
            enemy2.play('el_idle', true);
            enemy2.setVelocityX(0);
            if (dist < 620) enemy2.state = 'FOLLOW';
            break;
        case 'FOLLOW': {
            const dir = tgt.x < enemy2.x ? -1 : 1;
            enemy2.play('el_run', true);
            enemy2.setVelocityX(dir * 3.0);
            if (dist < 120) enemy2.state = 'ATTACK';
            if (dist > 740) enemy2.state = 'IDLE';
            break;
        }
        case 'HURT':
            enemy2.setVelocityX(0);
            if (now >= (enemy2._hurtUntil || 0)) enemy2.state = 'FOLLOW';
            break;
        case 'DEFEND':
            enemy2.setVelocityX(0);
            enemy2.play('el_defend', true);
            if (now >= (enemy2._defendUntil || 0)) {
                enemy2.invulnerable = false;
                enemy2.state = 'FOLLOW';
            }
            break;
        case 'ATTACK': {
            enemy2.setVelocityX(0);
            if (enemy2.nextDecisionAt == null) enemy2.nextDecisionAt = now;
            if (now < enemy2.nextDecisionAt) {
                enemy2.play('el_idle', true);
                break;
            }
            const atkSeq = ['el_atk1', 'el_atk2', 'el_atk3', 'el_air_atk', 'el_sp_atk', 'el_defend'];
            const atkKey = atkSeq[enemy2.attackIndex % atkSeq.length];
            enemy2.attackIndex = (enemy2.attackIndex + 1) % atkSeq.length;

            const swingMs = atkKey === 'el_atk1'    ? (7/18*1000  + 150)
                          : atkKey === 'el_atk2'    ? (8/18*1000  + 150)
                          : atkKey === 'el_atk3'    ? (21/14*1000 + 150)
                          : atkKey === 'el_sp_atk'  ? (20/14*1000 + 150)
                          : atkKey === 'el_defend'  ? 2200
                          : /* el_air_atk */          (3/12*1000 + 8/18*1000 + 3/12*1000 + 200);

            enemy2.nextDecisionAt = now + swingMs + 150;
            enemy2.state = atkKey === 'el_defend' ? 'DEFEND' : 'SWING';
            enemy2._swingUntil = now + swingMs;

            if (atkKey === 'el_defend') {
                enemy2.invulnerable = true;
                enemy2._defendUntil = now + 2200;
                enemy2.play('el_defend', true);
            } else if (atkKey === 'el_air_atk') {
                const dir = player.x < enemy2.x ? -1 : 1;
                enemy2.setVelocityY(-12);
                enemy2.play('el_j_up', false);
                const jUpMs = 3 / 12 * 1000;
                scene.time.delayedCall(jUpMs, () => {
                    if (!enemy2 || !enemy2.active || enemy2.state === 'DEATH' || enemy2.state === 'HURT') return;
                    enemy2.play('el_air_atk', false);
                    scheduleBossMeleeHit(scene, enemy2, 180, bossDmgForLevel(4, 18), 75, true);
                    const airMs = 8 / 18 * 1000;
                    scene.time.delayedCall(airMs, () => {
                        if (!enemy2 || !enemy2.active || enemy2.state === 'DEATH' || enemy2.state === 'HURT') return;
                        enemy2.play('el_j_down', false);
                    });
                });
            } else {
                enemy2.play(atkKey, false);
                const hitDelay = atkKey === 'el_sp_atk' ? 400 : 180;
                const baseDmg = atkKey === 'el_sp_atk' ? 28 : 22;
                const hitRange = atkKey === 'el_sp_atk' ? 88 : 78;
                scheduleBossMeleeHit(scene, enemy2, hitDelay, bossDmgForLevel(4, baseDmg), hitRange, true);
            }
            break;
        }
        case 'SWING':
            enemy2.setVelocityX(0);
            if (now >= (enemy2._swingUntil || 0)) enemy2.state = 'FOLLOW';
            break;
        case 'DEATH':
            break;
    }
}


// ─────────────────────────────────────────────────────────────────────────────
//  UPPER 3 — BOSS DEMON SLIME (enemy2 on level 3)
// ─────────────────────────────────────────────────────────────────────────────
function updateUpper3SlimeBoss(scene) {
    if (!enemy2 || !enemy2.active || !player) return;
    const now  = scene.time.now;
    const tgt  = getClosestTarget(enemy2);
    if (enemy2.state !== 'DEATH') enemy2.setFlipX(tgt.x > enemy2.x);
    const dist = Phaser.Math.Distance.Between(tgt.x, tgt.y, enemy2.x, enemy2.y);

    if (enemy2.hp != null && enemy2.hp <= 0 && enemy2.state !== 'DEATH') {
        enemy2.state = 'DEATH'; enemy2.setVelocityX(0); enemy2.setVelocityY(0);
        if (enemy2.body) { enemy2.body.ignoreGravity = true; enemy2.body.collisionFilter = { group:0, category:0, mask: MAT.TERR }; }
    }

    if (!enemy2.phase2 && enemy2.hp > 0 && enemy2.hp <= enemy2.maxHp * 0.5) {
        enemy2.phase2 = true;
        enemy2.phase = 2;
        enemy2.displayName = 'Upper 3 — Phase 2';
        enemy2.setScale(1.14);
        enemy2.setTint(0xffaaaa);
        refreshHpBars();
    }

    if (enemy2.state === 'DEATH') {
        if (!enemy2._finishingDeath) {
            enemy2._finishingDeath = true;
            const deathSprite = enemy2;
            deathSprite.play('ds3_death', false);
            scene.time.delayedCall((22 / 10) * 1000 + 400, () => {
                if (deathSprite && deathSprite.active) deathSprite.destroy();
                if (enemy2 === deathSprite) enemy2 = null;
                if (!isAliveBoss(enemy) && !isAliveBoss(enemy2)) {
                    death = true;
                    trySpawnBossLoot(scene, player.x, player.y);
                }
            });
        }
        return;
    }

    switch (enemy2.state) {
        case 'IDLE':
            enemy2.play('ds3_idle', true); enemy2.setVelocityX(0);
            if (dist < 580) enemy2.state = 'FOLLOW'; break;
        case 'FOLLOW':
            enemy2.play('ds3_walk', true);
            enemy2.setVelocityX((tgt.x < enemy2.x ? -1 : 1) * (enemy2.phase2 ? 3.4 : 2.8));
            if (dist < 90)  enemy2.state = 'ATTACK';
            if (dist > 700) enemy2.state = 'IDLE'; break;
        case 'HURT':
            enemy2.setVelocityX(0);
            if (now >= (enemy2._hurtUntil || 0)) enemy2.state = 'FOLLOW'; break;
        case 'ATTACK': {
            enemy2.setVelocityX(0);
            if (enemy2.nextDecisionAt == null) enemy2.nextDecisionAt = now;
            if (now < enemy2.nextDecisionAt) {
                enemy2.play('ds3_idle', true);
                if (dist > 90) enemy2.state = 'FOLLOW';
                break;
            }
            const cleaveMs = (15/16)*1000 + 150;
            enemy2.nextDecisionAt = now + cleaveMs + 300;
            enemy2.state = 'SWING';
            enemy2._swingUntil = now + cleaveMs;
            enemy2.play('ds3_cleave', false);
            scheduleBossMeleeHit(scene, enemy2, 380, bossDmgForLevel(3, 20), 68, true);
            scheduleBossMeleeHit(scene, enemy2, 720, bossDmgForLevel(3, 16), 62, true);
            break;
        }
        case 'SWING':
            enemy2.setVelocityX(0);
            if (now >= (enemy2._swingUntil || 0)) enemy2.state = 'FOLLOW'; break;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  ANTAGONIST — SHADOW STALKER (Final Boss L5)
// ─────────────────────────────────────────────────────────────────────────────
function updateAntagonist(scene) {
    if (!enemy || !enemy.active || !player) return;
    const now = scene.time.now;
    const tgt = getClosestTarget(enemy);
    const dist = Phaser.Math.Distance.Between(tgt.x, tgt.y, enemy.x, enemy.y);
    const el = enemy.isElemental;

    if (enemy.state !== 'DEATH' && enemy.state !== 'TRANSFORM') enemy.setFlipX(tgt.x < enemy.x);

    if (enemy.hp != null && enemy.hp <= 0 && enemy.state !== 'DEATH') {
        enemy.state = 'DEATH'; enemy.invulnerable = true;
        enemy.setVelocityX(0); enemy.setVelocityY(0);
        if (enemy.body) { enemy.body.ignoreGravity = true; enemy.body.collisionFilter = { group:0, category:0, mask: MAT.TERR }; }
    }

    if (enemy.state === 'DEATH') {
        if (!enemy._finishingDeath) {
            enemy._finishingDeath = true;
            const ds = enemy;
            const b2hMs = (14 / 14) * 1000 + 150;
            const deathMs = (12 / 10) * 1000 + 400;
            ds.play('ss_back2human', false);
            // Safety net — always reach EndScene after level 5 boss dies
            scheduleWinEndScene(scene, b2hMs + deathMs + 1500);
            scene.time.delayedCall(b2hMs, () => {
                if (!ds || !ds.active) return;
                ds.play('ss_death', false);
                scene.time.delayedCall(deathMs, () => {
                    if (ds && ds.active) ds.destroy();
                    if (enemy === ds) enemy = null;
                    trySpawnBossLoot(scene, player.x, player.y);
                    scheduleWinEndScene(scene, 800);
                });
            });
        }
        return;
    }

    if (enemy.state === 'TRANSFORM') return;

    if (enemy.state === 'HURT') {
        enemy.setVelocityX(0);
        if (now >= (enemy._hurtUntil || 0)) enemy.state = 'FOLLOW';
        return;
    }

    // Attack timing tables
    const H_SEQ = ['ss_1_atk','ss_2_atk','ss_3_atk','ss_air_atk','ss_sp_atk','ss_defend'];
    const H_MS  = { ss_1_atk:9/18*1000+120, ss_2_atk:17/18*1000+120, ss_3_atk:23/14*1000+150, ss_air_atk:8/18*1000+100, ss_sp_atk:34/14*1000+200, ss_defend:2400 };
    const H_DMG = { ss_1_atk:16, ss_2_atk:22, ss_3_atk:28, ss_air_atk:18, ss_sp_atk:36, ss_defend:0 };
    const E_SEQ = ['ss_e_1_atk','ss_e_2_atk','ss_e_3_atk','ss_e_air','ss_e_sp','ss_e_defend'];
    const E_MS  = { ss_e_1_atk:14/18*1000+120, ss_e_2_atk:22/18*1000+120, ss_e_3_atk:35/14*1000+200, ss_e_air:8/18*1000+100, ss_e_sp:19/14*1000+150, ss_e_defend:2400 };
    const E_DMG = { ss_e_1_atk:20, ss_e_2_atk:28, ss_e_3_atk:36, ss_e_air:22, ss_e_sp:44, ss_e_defend:0 };

    const ATK_SEQ  = el ? E_SEQ  : H_SEQ;
    const ATK_MS   = el ? E_MS   : H_MS;
    const ATK_DMG  = el ? E_DMG  : H_DMG;
    const idleKey  = el ? 'ss_e_idle'   : 'ss_idle';
    const runKey   = el ? 'ss_e_run'    : 'ss_run';
    const defendKey= el ? 'ss_e_defend' : 'ss_defend';

    switch (enemy.state) {
        case 'IDLE':
            enemy.play(idleKey, true); enemy.setVelocityX(0);
            if (dist < 620) enemy.state = 'FOLLOW'; break;
        case 'FOLLOW':
            enemy.play(runKey, true);
            enemy.setVelocityX((tgt.x < enemy.x ? -1 : 1) * (el ? 3.5 : 2.8));
            if (dist < 110) enemy.state = 'ATTACK';
            if (dist > 740) enemy.state = 'IDLE'; break;
        case 'DEFEND':
            enemy.setVelocityX(0); enemy.play(defendKey, true);
            if (now >= (enemy._defendUntil || 0)) { enemy.invulnerable = false; enemy.state = 'FOLLOW'; } break;
        case 'ATTACK': {
            enemy.setVelocityX(0);
            if (enemy.nextDecisionAt == null) enemy.nextDecisionAt = now;
            if (now < enemy.nextDecisionAt) {
                enemy.play(idleKey, true);
                if (dist > 140) enemy.state = 'FOLLOW';
                break;
            }
            const ak = ATK_SEQ[enemy.attackIndex % ATK_SEQ.length];
            enemy.attackIndex = (enemy.attackIndex + 1) % ATK_SEQ.length;
            const swingMs = ATK_MS[ak];
            enemy.nextDecisionAt = now + swingMs + 250;
            enemy._swingUntil = now + swingMs;

            if (ak === defendKey || ak === 'ss_defend' || ak === 'ss_e_defend') {
                enemy.state = 'DEFEND'; enemy.invulnerable = true;
                enemy._defendUntil = now + 2400; enemy.play(defendKey, true);

            } else if (ak === 'ss_air_atk' || ak === 'ss_e_air') {
                enemy.state = 'SWING';
                enemy.setVelocityY(-11);
                enemy.play(el ? 'ss_e_jump' : 'ss_jump', false);
                const jumpUpMs = el ? (15/12*1000) : (13/12*1000);
                scene.time.delayedCall(jumpUpMs * 0.4, () => {
                    if (!enemy || !enemy.active || enemy.state === 'DEATH') return;
                    enemy.play(ak, false);
                    scene.time.delayedCall(ATK_MS[ak] * 0.4, () => {
                        if (!enemy || !enemy.active || enemy.state === 'DEATH') return;
                        const dmg = ATK_DMG[ak] || 18;
                        const dp = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
                        if (dp <= 140) {
                            const keysRef = scene && scene.keys;
                            const blocking = keysRef && keysRef.i.isDown && playerCombatLock === 'block';
                            if (!blocking && !isPlayerDodgeInvulnerable()) damagePlayer(scene, dmg);
                        }
                        _hitAllies(scene, enemy.x, enemy.y, 140, dmg);
                    });
                });

            } else {
                enemy.state = 'SWING';
                enemy.play(ak, false);
                const hitDelay = (ak === 'ss_sp_atk' || ak === 'ss_e_sp') ? swingMs * 0.45 : swingMs * 0.3;
                const dmg = ATK_DMG[ak] || 16;
                const range = (ak === 'ss_sp_atk' || ak === 'ss_e_sp') ? 160 : 120;
                scene.time.delayedCall(hitDelay, () => {
                    if (!enemy || !enemy.active || enemy.state === 'DEATH') return;
                    const dp = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
                    if (dp <= range) {
                        const keysRef = scene && scene.keys;
                        const blocking = keysRef && keysRef.i.isDown && playerCombatLock === 'block';
                        if (!blocking && !isPlayerDodgeInvulnerable()) damagePlayer(scene, dmg);
                    }
                    _hitAllies(scene, enemy.x, enemy.y, range, dmg);
                });
                // Second hit for 3_atk variants
                if (ak === 'ss_3_atk' || ak === 'ss_e_3_atk') {
                    scene.time.delayedCall(swingMs * 0.6, () => {
                        if (!enemy || !enemy.active || enemy.state === 'DEATH') return;
                        const dmg2 = Math.round(dmg * 0.7);
                        const dp = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
                        if (dp <= 130) {
                            const keysRef = scene && scene.keys;
                            const blocking = keysRef && keysRef.i.isDown && playerCombatLock === 'block';
                            if (!blocking && !isPlayerDodgeInvulnerable()) damagePlayer(scene, dmg2);
                        }
                        _hitAllies(scene, enemy.x, enemy.y, 130, dmg2);
                    });
                }
            }
            break;
        }
        case 'SWING':
            enemy.setVelocityX(0);
            if (now >= (enemy._swingUntil || 0)) enemy.state = 'FOLLOW'; break;
    }
}
// ─────────────────────────────────────────────────────────────────────────────
//  WIND HASHIRA ALLY
// ─────────────────────────────────────────────────────────────────────────────

function spawnWindHashiraNpc() {
    const scene = this;
    const nx = DOOR_X - 90;
    const ny = 180;

    ally = scene.matter.add.sprite(nx, ny, 'wh_idle_1', null, {
        inertia: Infinity, mass: 3, label: 'ally',
        restitution: 0, frictionStatic: 1, friction: 1,
        shape: { type: 'rectangle', width: 32, height: 60 }
    });
    ally.setDepth(9);
    ally.setFixedRotation();
    ally._state = allyRecruited ? 'FOLLOW' : 'NPC';
    ally._attackIndex = 0;
    ally._swingUntil = 0;
    ally._hurtUntil = 0;
    ally._lastHurtMilestone = ALLY_MAX_HP;
    ally._dialogShown = false;
    allyHp = ALLY_MAX_HP;

    if (ally.body) {
        ally.body.collisionFilter = { group: 0, category: MAT.PL, mask: MAT.TERR };
    }
    if (uiCamera) uiCamera.ignore([ally]);
    ally.play('wh_idle', true);
}

function showAllyDialog(scene, msg) {
    if (allyDialogBox) return;
    const W = scene.scale.width;
    const H = scene.scale.height;
    allyDialogBox = scene.add.rectangle(8, H - 80, 320, 60, 0x000000, 0.82)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(200);
    allyDialogText = scene.add.text(16, H - 74, msg, {
        font: '12px Arial', fill: '#ffffff', wordWrap: { width: 300 }
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(201);
    if (camera) camera.ignore([allyDialogBox, allyDialogText]);
}

function hideAllyDialog() {
    if (allyDialogBox) { allyDialogBox.destroy(); allyDialogBox = null; }
    if (allyDialogText) { allyDialogText.destroy(); allyDialogText = null; }
}

function updateAlly(scene) {
    if (!ally || !ally.active) return;
    const now = scene.time.now;

    if (ally._state === 'NPC') {
        ally.play('wh_idle', true);
        ally.setVelocityX(0);
        ally.flipX = false;

        if (player && player.active) {
            const d = Phaser.Math.Distance.Between(player.x, player.y, ally.x, ally.y);
            const inRange = d < 90;
            if (inRange && !ally._dialogShown && !allyRecruited) {
                ally._dialogShown = true;
                showAllyDialog(gameSceneRef, '"I will travel by your side\nfor 3 potions."  [E] to recruit');
            }
            if (!inRange && allyDialogBox) {
                hideAllyDialog();
                ally._dialogShown = false;
            }
            if (inRange && Phaser.Input.Keyboard.JustDown(enterKey)) {
                if (potionCount >= ALLY_POTION_COST) {
                    potionCount -= ALLY_POTION_COST;
                    allyRecruited = true;
                    ally._state = 'FOLLOW';
                    if (ally.body) {
                        ally.body.collisionFilter = { group: 0, category: MAT.ALLY, mask: MAT.TERR };
                    }
                    hideAllyDialog();
                } else {
                    if (allyDialogText) {
                        allyDialogText.setText('"I will travel by your side\nfor 3 potions."  [E] to recruit\nNeed more potions!');
                        allyDialogText.setTint(0xff4444);
                        scene.time.delayedCall(800, () => {
                            if (allyDialogText) {
                                allyDialogText.clearTint();
                                allyDialogText.setText('"I will travel by your side\nfor 3 potions."  [E] to recruit');
                            }
                        });
                    }
                }
            }
        }
        return;
    }

    if (!allyRecruited) return;

    if (ally._state === 'DEAD') {
        ally.setVelocityX(0);
        return;
    }

    const tgt = nearestBossToPlayer();
    const faceTarget = tgt || player;
    if (faceTarget) ally.flipX = faceTarget.x < ally.x;

    const distToPlayer = player ? Phaser.Math.Distance.Between(player.x, player.y, ally.x, ally.y) : 999;

    const ATK_SEQ = ['wh_atk1', 'wh_atk2', 'wh_atk3', 'wh_air', 'wh_sp_atk', 'wh_defend'];
    const ATK_MS  = {
        wh_atk1:   8  / 18 * 1000 + 100,
        wh_atk2:   18 / 18 * 1000 + 100,
        wh_atk3:   26 / 14 * 1000 + 150,
        wh_air:    (3/12 + 7/18 + 3/12) * 1000 + 200,
        wh_sp_atk: 30 / 14 * 1000 + 200,
        wh_defend: 2200,
    };
    const ATK_DMG = { wh_atk1: 8, wh_atk2: 10, wh_atk3: 13, wh_air: 9, wh_sp_atk: 18, wh_defend: 0 };

    switch (ally._state) {
        case 'FOLLOW':
            if (tgt) { ally._state = 'CHASE'; break; }
            if (distToPlayer > 120) {
                ally.setVelocityX((player.x < ally.x ? -1 : 1) * 3.0);
                ally.play('wh_run', true);
            } else {
                ally.setVelocityX(0);
                ally.play('wh_idle', true);
            }
            break;
        case 'CHASE': {
            if (!tgt) { ally._state = 'FOLLOW'; break; }
            const de = Phaser.Math.Distance.Between(ally.x, ally.y, tgt.x, tgt.y);
            const chaseStop = (tgt.kind === 'upper4_db') ? 90 : 55;
            if (de > chaseStop) {
                ally.setVelocityX((tgt.x < ally.x ? -1 : 1) * 3.4);
                ally.play('wh_run', true);
            } else {
                ally.setVelocityX(0);
                ally._state = 'ATTACK';
            }
            break;
        }
        case 'ATTACK': {
            if (!tgt) { ally._state = 'FOLLOW'; break; }
            const de = Phaser.Math.Distance.Between(ally.x, ally.y, tgt.x, tgt.y);
            ally.setVelocityX(0);
            const atkLeash = (tgt.kind === 'upper4_db') ? 110 : 75;
            if (de > atkLeash) { ally._state = 'CHASE'; break; }
            if (now < (ally._nextAtkAt || 0)) {
                ally.play('wh_idle', true);
                break;
            }
            const ak = ATK_SEQ[ally._attackIndex % ATK_SEQ.length];
            ally._attackIndex++;
            const swingMs = ATK_MS[ak];
            ally._swingUntil = now + swingMs;
            ally._nextAtkAt = now + swingMs + 200;
            ally._currentAtk = ak;
            ally._state = ak === 'wh_defend' ? 'DEFEND' : 'SWING';

            if (ak === 'wh_defend') {
                ally.play('wh_defend', true);
                ally._defendUntil = now + 2200;
            } else if (ak === 'wh_air') {
                ally.setVelocityY(-10);
                ally.play('wh_j_up', false);
                scene.time.delayedCall(3/12*1000, () => {
                    if (!ally || !ally.active || ally._state === 'DEAD') return;
                    ally.play('wh_air', false);
                    scene.time.delayedCall(200, () => {
                        if (!ally || !ally.active) return;
                        const bt = nearestBossToPlayer();
                        if (!bt || !bt.active || bt.state === 'DEATH' || bt.invulnerable) return;
                        const hitRange = (bt.kind === 'upper4_db') ? 120 : 80;
                        if (Phaser.Math.Distance.Between(ally.x, ally.y, bt.x, bt.y) > hitRange) return;
                        damageEnemy(scene, ATK_DMG.wh_air, { target: bt, skipUltCharge: true });
                    });
                    scene.time.delayedCall(7/18*1000, () => {
                        if (!ally || !ally.active || ally._state === 'DEAD') return;
                        ally.play('wh_j_down', false);
                    });
                });
            } else {
                ally.play(ak, false);
                const hitDelay = swingMs * 0.3;
                scene.time.delayedCall(hitDelay, () => {
                    if (!ally || !ally.active) return;
                    const bt = nearestBossToPlayer();
                    if (!bt || !bt.active || bt.state === 'DEATH' || bt.invulnerable) return;
                    const hitRange = (bt.kind === 'upper4_db') ? 120 : 80;
                    if (Phaser.Math.Distance.Between(ally.x, ally.y, bt.x, bt.y) > hitRange) return;
                    damageEnemy(scene, ATK_DMG[ak] || 14, { target: bt, skipUltCharge: true });
                });
            }
            break;
        }
        case 'SWING':
            ally.setVelocityX(0);
            if (now >= (ally._swingUntil || 0)) {
                ally._state = tgt ? 'ATTACK' : 'FOLLOW';
            }
            break;
        case 'DEFEND':
            ally.setVelocityX(0);
            ally.play('wh_defend', true);
            if (now >= (ally._defendUntil || 0)) {
                ally._state = tgt ? 'ATTACK' : 'FOLLOW';
            }
            break;
        case 'HURT':
            ally.setVelocityX(0);
            break;
        case 'DEAD':
            ally.setVelocityX(0);
            break;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  FIRE + WATER HASHIRA PAIR
// ─────────────────────────────────────────────────────────────────────────────

function spawnFireWaterNpc() {
    const scene = this;
    const baseY = 540;
    const fkX = DOOR_X - 130;
    const wkX = DOOR_X - 80;

    fkAlly = scene.matter.add.sprite(fkX, baseY, 'fk_idle_1', null, {
        inertia: Infinity, mass: 3, label: 'fk_ally',
        restitution: 0, frictionStatic: 1, friction: 1,
        shape: { type: 'rectangle', width: 32, height: 60 }
    });
    fkAlly.setDepth(9);
    fkAlly.setFixedRotation();
    fkAlly._state = fkAllyRecruited ? 'FOLLOW' : 'NPC';
    fkAlly._attackIndex = 0;
    fkAlly._swingUntil = 0;
    fkAlly._hurtUntil = 0;
    fkAlly._lastHurtMilestone = FK_ALLY_MAX_HP;
    fkAllyHp = FK_ALLY_MAX_HP;

    if (fkAlly.body) {
        fkAlly.body.collisionFilter = { group: 0, category: MAT.PL, mask: MAT.TERR };
    }
    if (uiCamera) uiCamera.ignore([fkAlly]);
    fkAlly.play('fk_idle', true);

    wkAlly = scene.matter.add.sprite(wkX, baseY, 'wk_idle_1', null, {
        inertia: Infinity, mass: 3, label: 'wk_ally',
        restitution: 0, frictionStatic: 1, friction: 1,
        shape: { type: 'rectangle', width: 32, height: 60 }
    });
    wkAlly.setDepth(9);
    wkAlly.setFixedRotation();
    wkAlly._state = wkAllyRecruited ? 'FOLLOW' : 'NPC';
    wkAlly._attackIndex = 0;
    wkAlly._swingUntil = 0;
    wkAlly._hurtUntil = 0;
    wkAlly._lastHurtMilestone = WK_ALLY_MAX_HP;
    wkAllyHp = WK_ALLY_MAX_HP;

    if (wkAlly.body) {
        wkAlly.body.collisionFilter = { group: 0, category: MAT.PL, mask: MAT.TERR };
    }
    if (uiCamera) uiCamera.ignore([wkAlly]);
    wkAlly.play('wk_idle', true);
}

function showFwDialog(scene, msg) {
    if (fwAllyDialogBox) return;
    const W = scene.scale.width;
    const H = scene.scale.height;
    fwAllyDialogBox = scene.add.rectangle(8, H - 80, 360, 60, 0x000000, 0.82)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(200);
    fwAllyDialogText = scene.add.text(16, H - 74, msg, {
        font: '12px Arial', fill: '#ffffff', wordWrap: { width: 340 }
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(201);
    if (camera) camera.ignore([fwAllyDialogBox, fwAllyDialogText]);
}

function hideFwDialog() {
    if (fwAllyDialogBox) { fwAllyDialogBox.destroy(); fwAllyDialogBox = null; }
    if (fwAllyDialogText) { fwAllyDialogText.destroy(); fwAllyDialogText = null; }
    fwAllyDialogShown = false;
}

function _updateHashiraAlly(scene, cfg) {
    const {
        getAlly, setAllyNull,
        getHp, setHp, getMaxHp,
        getRecruited, setRecruited,
        idleAnim, runAnim, atkAnims, atkDmg, atkMs,
        airAnimKey, jUpKey, jDownKey,
        defendAnim, hurtAnim, deathAnim,
        hurtFrames, hurtFps,
        damageAllyFn
    } = cfg;

    const a = getAlly();
    if (!a || !a.active) return;
    const now = scene.time.now;

    if (a._state === 'NPC') {
        a.play(idleAnim, true);
        a.setVelocityX(0);
        a.flipX = false;
        return;
    }

    if (!getRecruited()) return;

    if (a._state === 'DEAD') { a.setVelocityX(0); return; }

    const tgt = nearestBossToPlayer();
    const faceTarget = tgt || player;
    if (faceTarget) a.flipX = faceTarget.x < a.x;

    const ATK_SEQ = atkAnims;
    const ATK_MS  = atkMs;
    const ATK_DMG = atkDmg;

    switch (a._state) {
        case 'FOLLOW':
            if (tgt) { a._state = 'CHASE'; break; }
            if (player && Phaser.Math.Distance.Between(player.x, player.y, a.x, a.y) > 120) {
                a.setVelocityX((player.x < a.x ? -1 : 1) * 3.0);
                a.play(runAnim, true);
            } else {
                a.setVelocityX(0);
                a.play(idleAnim, true);
            }
            break;
        case 'CHASE': {
            if (!tgt) { a._state = 'FOLLOW'; break; }
            const de = Phaser.Math.Distance.Between(a.x, a.y, tgt.x, tgt.y);
            const chaseStop = (tgt.kind === 'upper4_db') ? 90 : 55;
            if (de > chaseStop) {
                a.setVelocityX((tgt.x < a.x ? -1 : 1) * 3.4);
                a.play(runAnim, true);
            } else {
                a.setVelocityX(0);
                a._state = 'ATTACK';
            }
            break;
        }
        case 'ATTACK': {
            if (!tgt) { a._state = 'FOLLOW'; break; }
            const de = Phaser.Math.Distance.Between(a.x, a.y, tgt.x, tgt.y);
            a.setVelocityX(0);
            const atkLeash = (tgt.kind === 'upper4_db') ? 110 : 75;
            if (de > atkLeash) { a._state = 'CHASE'; break; }

            if (now < (a._nextAtkAt || 0)) {
                a.play(idleAnim, true);
                break;
            }

            const ak = ATK_SEQ[a._attackIndex % ATK_SEQ.length];
            a._attackIndex++;
            const swingMs = ATK_MS[ak];
            a._swingUntil = now + swingMs;
            a._nextAtkAt  = now + swingMs + 200;
            a._currentAtk = ak;
            a._state = ak === defendAnim ? 'DEFEND' : 'SWING';

            if (ak === defendAnim) {
                a.play(defendAnim, true);
                a._defendUntil = now + 2200;
            } else if (ak === airAnimKey) {
                a.setVelocityY(-10);
                a.play(jUpKey, false);
                scene.time.delayedCall(3/12*1000, () => {
                    if (!getAlly() || !getAlly().active || getAlly()._state === 'DEAD') return;
                    getAlly().play(airAnimKey, false);
                    scene.time.delayedCall(200, () => {
                        const cur = getAlly();
                        if (!cur || !cur.active) return;
                        const bt = nearestBossToPlayer();
                        if (!bt || !bt.active || bt.state === 'DEATH' || bt.invulnerable) return;
                        const hitRange = (bt.kind === 'upper4_db') ? 120 : 80;
                        if (Phaser.Math.Distance.Between(cur.x, cur.y, bt.x, bt.y) > hitRange) return;
                        damageEnemy(scene, ATK_DMG[airAnimKey] || 14, { target: bt, skipUltCharge: true });
                    });
                    scene.time.delayedCall(8/18*1000, () => {
                        const cur = getAlly();
                        if (!cur || !cur.active || cur._state === 'DEAD') return;
                        cur.play(jDownKey, false);
                    });
                });
            } else {
                a.play(ak, false);
                const hitDelay = swingMs * 0.3;
                scene.time.delayedCall(hitDelay, () => {
                    const cur = getAlly();
                    if (!cur || !cur.active) return;
                    const bt = nearestBossToPlayer();
                    if (!bt || !bt.active || bt.state === 'DEATH' || bt.invulnerable) return;
                    const hitRange = (bt.kind === 'upper4_db') ? 120 : 80;
                    if (Phaser.Math.Distance.Between(cur.x, cur.y, bt.x, bt.y) > hitRange) return;
                    damageEnemy(scene, ATK_DMG[ak] || 14, { target: bt, skipUltCharge: true });
                });
            }
            break;
        }
        case 'SWING':
            a.setVelocityX(0);
            if (now >= (a._swingUntil || 0)) a._state = tgt ? 'ATTACK' : 'FOLLOW';
            break;
        case 'DEFEND':
            a.setVelocityX(0);
            a.play(defendAnim, true);
            if (now >= (a._defendUntil || 0)) {
                if (cfg.healAnim) {
                    a._state = 'HEAL';
                    a._healDone = false;
                } else {
                    a._state = tgt ? 'ATTACK' : 'FOLLOW';
                }
            }
            break;
        case 'HEAL': {
            a.setVelocityX(0);
            if (!a._healDone) {
                a._healDone = true;
                const maxHp = cfg.getMaxHp();
                cfg.setHp(Math.min(maxHp, cfg.getHp() + (cfg.healHp || 50)));
                const healMs = (cfg.healFrames || 12) / (cfg.healFps || 10) * 1000;
                a.play(cfg.healAnim, false);
                a._healUntil = now + healMs + 100;
            }
            if (now >= (a._healUntil || 0)) {
                a._healDone = false;
                a._state = tgt ? 'ATTACK' : 'FOLLOW';
            }
            break;
        }
        case 'HURT':
        case 'DEAD':
            a.setVelocityX(0);
            break;
    }
}

function updateFkWkNpcInteract(scene) {
    const fkNpc = fkAlly && fkAlly.active && fkAlly._state === 'NPC';
    const wkNpc = wkAlly && wkAlly.active && wkAlly._state === 'NPC';
    if (!fkNpc && !wkNpc) return;
    if (fkAllyRecruited) return;

    if (!player || !player.active) return;

    const dx1 = fkAlly ? Phaser.Math.Distance.Between(player.x, player.y, fkAlly.x, fkAlly.y) : 9999;
    const dx2 = wkAlly ? Phaser.Math.Distance.Between(player.x, player.y, wkAlly.x, wkAlly.y) : 9999;
    const inRange = Math.min(dx1, dx2) < 90;

    if (inRange && !fwAllyDialogShown) {
        fwAllyDialogShown = true;
        showFwDialog(gameSceneRef, '"Receive the aid of fire and water\n- 3 potions."  [E] to recruit');
    }
    if (!inRange && fwAllyDialogBox) {
        hideFwDialog();
    }

    if (inRange && Phaser.Input.Keyboard.JustDown(enterKey)) {
        if (potionCount >= FW_ALLY_POTION_COST) {
            potionCount -= FW_ALLY_POTION_COST;
            fkAllyRecruited = true;
            wkAllyRecruited = true;
            if (fkAlly && fkAlly.body) {
                fkAlly._state = 'FOLLOW';
                fkAlly.body.collisionFilter = { group: 0, category: MAT.ALLY, mask: MAT.TERR };
            }
            if (wkAlly && wkAlly.body) {
                wkAlly._state = 'FOLLOW';
                wkAlly.body.collisionFilter = { group: 0, category: MAT.ALLY, mask: MAT.TERR };
            }
            hideFwDialog();
        } else {
            if (fwAllyDialogText) {
                fwAllyDialogText.setText('"Receive the aid of fire and water\n- 3 potions."  [E] to recruit\nNeed more potions!');
                fwAllyDialogText.setTint(0xff4444);
                scene.time.delayedCall(800, () => {
                    if (fwAllyDialogText) {
                        fwAllyDialogText.clearTint();
                        fwAllyDialogText.setText('"Receive the aid of fire and water\n- 3 potions."  [E] to recruit');
                    }
                });
            }
        }
    }
}

function updateFkAlly(scene) {
    updateFkWkNpcInteract(scene);

    _updateHashiraAlly(scene, {
        getAlly:       () => fkAlly,
        setAllyNull:  () => { fkAlly = null; },
        getHp:        () => fkAllyHp,
        setHp:        (v) => { fkAllyHp = v; if (fkAlly) fkAlly._lastHurtMilestone = Math.ceil(v / 200) * 200; },
        getMaxHp:     () => FK_ALLY_MAX_HP,
        getRecruited: () => fkAllyRecruited,
        setRecruited: (v) => { fkAllyRecruited = v; },
        idleAnim:  'fk_idle',
        runAnim:   'fk_run',
        atkAnims:  ['fk_atk1', 'fk_atk2', 'fk_atk3', 'fk_air', 'fk_sp_atk', 'fk_defend'],
        atkMs: {
            fk_atk1:   11 / 18 * 1000 + 100,
            fk_atk2:   19 / 18 * 1000 + 100,
            fk_atk3:   28 / 14 * 1000 + 150,
            fk_air:    (20/14 + 8/18) * 1000 + 200,
            fk_sp_atk: 18 / 14 * 1000 + 200,
            fk_defend: 2200,
        },
        atkDmg: {
            fk_atk1:   8,
            fk_atk2:   10,
            fk_atk3:   13,
            fk_air:    9,
            fk_sp_atk: 18,
            fk_defend: 0,
        },
        airAnimKey: 'fk_air',
        jUpKey:     'fk_jump',
        jDownKey:   'fk_jump',
        defendAnim: 'fk_defend',
        hurtAnim:   'fk_hurt',
        deathAnim:  'fk_death',
        hurtFrames: 6,
        hurtFps:    14,
        damageAllyFn: damageFkAlly,
    });
}

function updateWkAlly(scene) {
    _updateHashiraAlly(scene, {
        getAlly:       () => wkAlly,
        setAllyNull:  () => { wkAlly = null; },
        getHp:        () => wkAllyHp,
        setHp:        (v) => { wkAllyHp = v; if (wkAlly) wkAlly._lastHurtMilestone = Math.ceil(v / 200) * 200; },
        getMaxHp:     () => WK_ALLY_MAX_HP,
        getRecruited: () => wkAllyRecruited,
        setRecruited: (v) => { wkAllyRecruited = v; },
        idleAnim:  'wk_idle',
        runAnim:   'wk_run',
        atkAnims:  ['wk_atk1', 'wk_atk2', 'wk_atk3', 'wk_air', 'wk_sp_atk', 'wk_defend'],
        atkMs: {
            wk_atk1:   7  / 18 * 1000 + 100,
            wk_atk2:   21 / 18 * 1000 + 100,
            wk_atk3:   27 / 14 * 1000 + 150,
            wk_air:    (3/12 + 8/18 + 3/12) * 1000 + 200,
            wk_sp_atk: 32 / 14 * 1000 + 200,
            wk_defend: 2200,
        },
        atkDmg: {
            wk_atk1:   8,
            wk_atk2:   10,
            wk_atk3:   13,
            wk_air:    9,
            wk_sp_atk: 18,
            wk_defend: 0,
        },
        airAnimKey: 'wk_air',
        jUpKey:     'wk_j_up',
        jDownKey:   'wk_j_down',
        defendAnim: 'wk_defend',
        hurtAnim:   'wk_hurt',
        deathAnim:  'wk_death',
        hurtFrames: 7,
        hurtFps:    14,
        healAnim:   'wk_heal',
        healFrames: 12,
        healFps:    10,
        healHp:     50,
        damageAllyFn: damageWkAlly,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
//  GROUND + SOUND HASHIRA PAIR
// ─────────────────────────────────────────────────────────────────────────────

function spawnGroundSoundNpc() {
    const scene = this;
    const baseY = 840;
    const gmX = DOOR_X - 130;
    const mbX = DOOR_X - 80;

    gmAlly = scene.matter.add.sprite(gmX, baseY, 'gm_idle_1', null, {
        inertia: Infinity, mass: 3, label: 'gm_ally',
        restitution: 0, frictionStatic: 1, friction: 1,
        shape: { type: 'rectangle', width: 32, height: 60 }
    });
    gmAlly.setDepth(9);
    gmAlly.setFixedRotation();
    gmAlly._state = gmAllyRecruited ? 'FOLLOW' : 'NPC';
    gmAlly._attackIndex = 0;
    gmAlly._swingUntil = 0;
    gmAlly._hurtUntil = 0;
    gmAlly._lastHurtMilestone = GM_ALLY_MAX_HP;
    gmAllyHp = GM_ALLY_MAX_HP;

    if (gmAlly.body) {
        gmAlly.body.collisionFilter = { group: 0, category: MAT.PL, mask: MAT.TERR };
    }
    if (uiCamera) uiCamera.ignore([gmAlly]);
    gmAlly.play('gm_idle', true);

    mbAlly = scene.matter.add.sprite(mbX, baseY, 'mb_idle_1', null, {
        inertia: Infinity, mass: 3, label: 'mb_ally',
        restitution: 0, frictionStatic: 1, friction: 1,
        shape: { type: 'rectangle', width: 32, height: 60 }
    });
    mbAlly.setDepth(9);
    mbAlly.setFixedRotation();
    mbAlly._state = mbAllyRecruited ? 'FOLLOW' : 'NPC';
    mbAlly._attackIndex = 0;
    mbAlly._swingUntil = 0;
    mbAlly._hurtUntil = 0;
    mbAlly._lastHurtMilestone = MB_ALLY_MAX_HP;
    mbAllyHp = MB_ALLY_MAX_HP;

    if (mbAlly.body) {
        mbAlly.body.collisionFilter = { group: 0, category: MAT.PL, mask: MAT.TERR };
    }
    if (uiCamera) uiCamera.ignore([mbAlly]);
    mbAlly.play('mb_idle', true);
}

function showGsDialog(scene, msg) {
    if (gsAllyDialogBox) return;
    const W = scene.scale.width;
    const H = scene.scale.height;
    gsAllyDialogBox = scene.add.rectangle(8, H - 80, 360, 60, 0x000000, 0.82)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(200);
    gsAllyDialogText = scene.add.text(16, H - 74, msg, {
        font: '12px Arial', fill: '#ffffff', wordWrap: { width: 340 }
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(201);
    if (camera) camera.ignore([gsAllyDialogBox, gsAllyDialogText]);
}

function hideGsDialog() {
    if (gsAllyDialogBox) { gsAllyDialogBox.destroy(); gsAllyDialogBox = null; }
    if (gsAllyDialogText) { gsAllyDialogText.destroy(); gsAllyDialogText = null; }
}

function updateGsNpcInteract(scene) {
    const gmNpc = gmAlly && gmAlly.active && gmAlly._state === 'NPC';
    const mbNpc = mbAlly && mbAlly.active && mbAlly._state === 'NPC';
    if (!gmNpc && !mbNpc) return;
    if (gmAllyRecruited) return;

    if (!player || !player.active) return;

    const dx1 = gmAlly ? Phaser.Math.Distance.Between(player.x, player.y, gmAlly.x, gmAlly.y) : 9999;
    const dx2 = mbAlly ? Phaser.Math.Distance.Between(player.x, player.y, mbAlly.x, mbAlly.y) : 9999;
    const inRange = Math.min(dx1, dx2) < 90;

    if (inRange && !gsAllyDialogShown) {
        gsAllyDialogShown = true;
        showGsDialog(gameSceneRef, '"Receive our help\n- 3 potions."  [E] to recruit');
    }
    if (!inRange && gsAllyDialogBox) {
        hideGsDialog();
    }

    if (inRange && Phaser.Input.Keyboard.JustDown(enterKey)) {
        if (potionCount >= GS_ALLY_POTION_COST) {
            potionCount -= GS_ALLY_POTION_COST;
            gmAllyRecruited = true;
            mbAllyRecruited = true;
            if (gmAlly && gmAlly.body) {
                gmAlly._state = 'FOLLOW';
                gmAlly.body.collisionFilter = { group: 0, category: MAT.ALLY, mask: MAT.TERR };
            }
            if (mbAlly && mbAlly.body) {
                mbAlly._state = 'FOLLOW';
                mbAlly.body.collisionFilter = { group: 0, category: MAT.ALLY, mask: MAT.TERR };
            }
            hideGsDialog();
        } else {
            if (gsAllyDialogText) {
                gsAllyDialogText.setText('"Receive our help\n- 3 potions."  [E] to recruit\nNeed more potions!');
                gsAllyDialogText.setTint(0xff4444);
                scene.time.delayedCall(800, () => {
                    if (gsAllyDialogText) {
                        gsAllyDialogText.clearTint();
                        gsAllyDialogText.setText('"Receive our help\n- 3 potions."  [E] to recruit');
                    }
                });
            }
        }
    }
}

function updateGmAlly(scene) {
    updateGsNpcInteract(scene);

    _updateHashiraAlly(scene, {
        getAlly:       () => gmAlly,
        setAllyNull:  () => { gmAlly = null; },
        getHp:        () => gmAllyHp,
        setHp:        (v) => { gmAllyHp = v; if (gmAlly) gmAlly._lastHurtMilestone = Math.ceil(v / 200) * 200; },
        getMaxHp:     () => GM_ALLY_MAX_HP,
        getRecruited: () => gmAllyRecruited,
        setRecruited: (v) => { gmAllyRecruited = v; },
        idleAnim:  'gm_idle',
        runAnim:   'gm_run',
        atkAnims:  ['gm_atk1', 'gm_atk2', 'gm_atk3', 'gm_air', 'gm_sp_atk', 'gm_defend'],
        atkMs: {
            gm_atk1:   6  / 18 * 1000 + 100,
            gm_atk2:   12 / 18 * 1000 + 100,
            gm_atk3:   23 / 14 * 1000 + 150,
            gm_air:    (3/12 + 7/18 + 3/12) * 1000 + 200,
            gm_sp_atk: 25 / 14 * 1000 + 200,
            gm_defend: 2200,
        },
        atkDmg: {
            gm_atk1:   8,
            gm_atk2:   10,
            gm_atk3:   13,
            gm_air:    9,
            gm_sp_atk: 18,
            gm_defend: 0,
        },
        airAnimKey: 'gm_air',
        jUpKey:     'gm_j_up',
        jDownKey:   'gm_j_down',
        defendAnim: 'gm_defend',
        hurtAnim:   'gm_med',
        deathAnim:  'gm_death',
        hurtFrames: 6,
        hurtFps:    14,
        healAnim:   'gm_med',
        healFrames: 16,
        healFps:    10,
        healHp:     50,
        damageAllyFn: damageGmAlly,
    });
}

function updateMbAlly(scene) {
    _updateHashiraAlly(scene, {
        getAlly:       () => mbAlly,
        setAllyNull:  () => { mbAlly = null; },
        getHp:        () => mbAllyHp,
        setHp:        (v) => { mbAllyHp = v; if (mbAlly) mbAlly._lastHurtMilestone = Math.ceil(v / 200) * 200; },
        getMaxHp:     () => MB_ALLY_MAX_HP,
        getRecruited: () => mbAllyRecruited,
        setRecruited: (v) => { mbAllyRecruited = v; },
        idleAnim:  'mb_idle',
        runAnim:   'mb_run',
        atkAnims:  ['mb_atk1', 'mb_atk2', 'mb_atk3', 'mb_air', 'mb_sp_atk', 'mb_defend'],
        atkMs: {
            mb_atk1:   6  / 18 * 1000 + 100,
            mb_atk2:   8  / 18 * 1000 + 100,
            mb_atk3:   18 / 14 * 1000 + 150,
            mb_air:    (3/12 + 8/18 + 3/12) * 1000 + 200,
            mb_sp_atk: 11 / 14 * 1000 + 200,
            mb_defend: 2200,
        },
        atkDmg: {
            mb_atk1:   8,
            mb_atk2:   10,
            mb_atk3:   13,
            mb_air:    9,
            mb_sp_atk: 18,
            mb_defend: 0,
        },
        airAnimKey: 'mb_air',
        jUpKey:     'mb_j_up',
        jDownKey:   'mb_j_down',
        defendAnim: 'mb_defend',
        hurtAnim:   'mb_hurt',
        deathAnim:  'mb_death',
        hurtFrames: 6,
        hurtFps:    14,
        damageAllyFn: damageMbAlly,
    });
}
