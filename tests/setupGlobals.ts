import * as cocos from "./cc";
(globalThis as unknown as { cc: typeof cocos }).cc = cocos;
