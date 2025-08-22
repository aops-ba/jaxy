"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Kind = exports.Infix = void 0;
// todo: how the heck do i import this too
var Infix;
(function (Infix) {
    Infix["Plus"] = "+";
    Infix["Minus"] = "-";
    Infix["Times"] = "*";
    Infix["Divide"] = "/";
    Infix["Quotient"] = "#";
    Infix["Mod"] = "%";
    Infix["Caret"] = "^";
    Infix["Timestimes"] = "**";
})(Infix || (exports.Infix = Infix = {}));
var Kind;
(function (Kind) {
    Kind[Kind["Text"] = 0] = "Text";
    Kind[Kind["Value"] = 1] = "Value";
    Kind[Kind["Apply"] = 2] = "Apply";
    Kind[Kind["Tuple"] = 3] = "Tuple";
    Kind[Kind["Comment"] = 4] = "Comment";
})(Kind || (exports.Kind = Kind = {}));
//# sourceMappingURL=enums.js.map