//https://stackoverflow.com/a/70749281
export class ProgrammableTimer {

    constructor(hertz, callback) {

        this.target = performance.now();     // target time for the next frame
        this.interval = 1 / hertz * 1000;    // the milliseconds between ticks
        this.callback = callback;
        this.stopped = false;
        this.frame = 0;

        this.tick(this);
    }

    tick(self) {

        if (self.stopped) return;

        const currentTime = performance.now();
        const currentTarget = self.target;
        const currentInterval = (self.target += self.interval) - currentTime;

        setTimeout(self.tick, currentInterval, self);
        self.callback(self.frame++, currentTime, currentTarget, self);
    }

    stop() { this.stopped = true; return this.frame }

    adapt(hertz) { return this.interval = 1 / hertz * 1000 }

    redefine(replacement) { this.callback = replacement }
}