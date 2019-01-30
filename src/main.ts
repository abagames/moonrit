import * as view from "./view";
import * as matrix from "./matrix";
import * as sga from "./simpleGameActor";
import { Actor } from "./actor";
import * as keyboard from "./keyboard";

function init() {
  matrix.init();
  keyboard.init({ isFourWaysStick: true, isUsingStickKeysAsButton: true });
  sga.setActorClass(Actor);
  sga.reset();
  sga.spawn(player);
}

function player(a: Actor) {
  a.pos.set(7, 13);
  a.addUpdater(() => {
    if (keyboard.isJustPressed) {
      a.pos.add(keyboard.stick);
    }
  });
}

let ticks = 0;

function update() {
  matrix.print(bgStr, 1, 0, -1);
  keyboard.update();
  sga.update();
  matrix.update();
  ticks++;
}

const bgStr = `
gggggggggggggggg
g  g  g  g  g  g
bbbbbbbbbbbbbbbb
bbbbbbbbbbbbbbbb
bbbbbbbbbbbbbbbb
bbbbbbbbbbbbbbbb
bbbbbbbbbbbbbbbb
pppppppppppppppp
                
                
                
                
                
pppppppppppppppp
pppppppppppppppp
pppppppppppppppp
`;

view.init(init, update);
