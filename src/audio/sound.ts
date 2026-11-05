// Original oscillator effects; no sampled music or commercial audio.
export class Sound {
  enabled = false;
  private context?: AudioContext;
  async toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.context ??= new AudioContext();
      await this.context.resume();
      this.play("home");
    }
  }
  play(event: "hop" | "dead" | "home" | "level") {
    const c = this.context;
    if (!this.enabled || !c || c.state !== "running") return;
    const tone = c.createOscillator(),
      gain = c.createGain();
    const frequency = { hop: 440, dead: 130, home: 660, level: 880 }[event];
    const duration = event === "hop" ? 0.055 : 0.22;
    tone.type = "square";
    tone.frequency.setValueAtTime(frequency, c.currentTime);
    tone.frequency.exponentialRampToValueAtTime(
      event === "dead" ? 50 : frequency * 1.5,
      c.currentTime + duration,
    );
    gain.gain.setValueAtTime(0.025, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    tone.connect(gain);
    gain.connect(c.destination);
    tone.start();
    tone.stop(c.currentTime + duration);
  }
}
