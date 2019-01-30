import * as sga from "./simpleGameActor";
import { Vector } from "./vector";
import * as matrix from "./matrix";

export class Actor extends sga.Actor {
  pos = new Vector();
  str = "w";
  brightness = 2;

  update() {
    super.update();
    matrix.print(this.str, this.brightness, this.pos.x, this.pos.y);
  }
}
