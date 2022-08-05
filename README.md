An unscientific load test of Playwright contexts across browser and OSes.

An unexhaustive list of flaws in this testing logic:

- uses live site, so tests aren't hermetic and network latency comes into play
- we burst tests, but in reality tests take more variable time to start/finish, so—except at the start—you wouldn't see a need for X parallel newContext() calls
- very simple test and website (e.g. if the test did more, or loaded a JS or video heavy site, the results may be very different)
- we're not actually tracking that the context lifetimes are overalapping and for how long
- our average is of total time, not individual test time