import * as sga from "./simpleGameActor";
import { Vector } from "./vector";
import * as matrix from "./matrix";

export class Actor extends sga.Actor {
  pos = new Vector();
  colorChar = "w";

  update() {
    super.update();
    matrix.printChar(this.colorChar, 2, this.pos.x, this.pos.y);
  }
}
