export class Random {
  static between(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static pick<T>(array: T[]) {
    return array[this.between(0, array.length - 1)];
  }

  static flip() {
    return this.between(0, 1) === 0;
  }
}

export const Colors = {
  Red: {
    C50: 0xffebee,
    C100: 0xffcdd2,
    C200: 0xef9a9a,
    C300: 0xe57373,
    C400: 0xef5350,
    C500: 0xf44336,
    C600: 0xe53935,
    C700: 0xd32f2f,
    C800: 0xc62828,
    C900: 0xb71c1c,
    A100: 0xff8a80,
    A200: 0xff5252,
    A400: 0xff1744,
    A700: 0xd50000,
    color: () => convertToColor("Red"),
  },

  Pink: {
    C50: 0xfce4ec,
    C100: 0xf8bbd0,
    C200: 0xf48fb1,
    C300: 0xf06292,
    C400: 0xec407a,
    C500: 0xe91e63,
    C600: 0xd81b60,
    C700: 0xc2185b,
    C800: 0xad1457,
    C900: 0x880e4f,
    A100: 0xff80ab,
    A200: 0xff4081,
    A400: 0xf50057,
    A700: 0xc51162,
    color: () => convertToColor("Pink"),
  },

  Purple: {
    C50: 0xf3e5f5,
    C100: 0xe1bee7,
    C200: 0xce93d8,
    C300: 0xba68c8,
    C400: 0xab47bc,
    C500: 0x9c27b0,
    C600: 0x8e24aa,
    C700: 0x7b1fa2,
    C800: 0x6a1b9a,
    C900: 0x4a148c,
    A100: 0xea80fc,
    A200: 0xe040fb,
    A400: 0xd500f9,
    A700: 0xaa00ff,
    color: () => convertToColor("Purple"),
  },

  DeepPurple: {
    C50: 0xede7f6,
    C100: 0xd1c4e9,
    C200: 0xb39ddb,
    C300: 0x9575cd,
    C400: 0x7e57c2,
    C500: 0x673ab7,
    C600: 0x5e35b1,
    C700: 0x512da8,
    C800: 0x4527a0,
    C900: 0x311b92,
    A100: 0xb388ff,
    A200: 0x7c4dff,
    A400: 0x651fff,
    A700: 0x6200ea,
    color: () => convertToColor("DeepPurple"),
  },

  Indigo: {
    C50: 0xe8eaf6,
    C100: 0xc5cae9,
    C200: 0x9fa8da,
    C300: 0x7986cb,
    C400: 0x5c6bc0,
    C500: 0x3f51b5,
    C600: 0x3949ab,
    C700: 0x303f9f,
    C800: 0x283593,
    C900: 0x1a237e,
    A100: 0x8c9eff,
    A200: 0x536dfe,
    A400: 0x3d5afe,
    A700: 0x304ffe,
    color: () => convertToColor("Indigo"),
  },

  Blue: {
    C50: 0xe3f2fd,
    C100: 0xbbdefb,
    C200: 0x90caf9,
    C300: 0x64b5f6,
    C400: 0x42a5f5,
    C500: 0x2196f3,
    C600: 0x1e88e5,
    C700: 0x1976d2,
    C800: 0x1565c0,
    C900: 0x0d47a1,
    A100: 0x82b1ff,
    A200: 0x448aff,
    A400: 0x2979ff,
    A700: 0x2962ff,
    color: () => convertToColor("Blue"),
  },

  LightBlue: {
    C50: 0xe1f5fe,
    C100: 0xb3e5fc,
    C200: 0x81d4fa,
    C300: 0x4fc3f7,
    C400: 0x29b6f6,
    C500: 0x03a9f4,
    C600: 0x039be5,
    C700: 0x0288d1,
    C800: 0x0277bd,
    C900: 0x01579b,
    A100: 0x80d8ff,
    A200: 0x40c4ff,
    A400: 0x00b0ff,
    A700: 0x0091ea,
    color: () => convertToColor("LightBlue"),
  },

  Cyan: {
    C50: 0xe0f7fa,
    C100: 0xb2ebf2,
    C200: 0x80deea,
    C300: 0x4dd0e1,
    C400: 0x26c6da,
    C500: 0x00bcd4,
    C600: 0x00acc1,
    C700: 0x0097a7,
    C800: 0x00838f,
    C900: 0x006064,
    A100: 0x84ffff,
    A200: 0x18ffff,
    A400: 0x00e5ff,
    A700: 0x00b8d4,
    color: () => convertToColor("Cyan"),
  },

  Teal: {
    C50: 0xe0f2f1,
    C100: 0xb2dfdb,
    C200: 0x80cbc4,
    C300: 0x4db6ac,
    C400: 0x26a69a,
    C500: 0x009688,
    C600: 0x00897b,
    C700: 0x00796b,
    C800: 0x00695c,
    C900: 0x004d40,
    A100: 0xa7ffeb,
    A200: 0x64ffda,
    A400: 0x1de9b6,
    A700: 0x00bfa5,
    color: () => convertToColor("Teal"),
  },

  Green: {
    C50: 0xe8f5e9,
    C100: 0xc8e6c9,
    C200: 0xa5d6a7,
    C300: 0x81c784,
    C400: 0x66bb6a,
    C500: 0x4caf50,
    C600: 0x43a047,
    C700: 0x388e3c,
    C800: 0x2e7d32,
    C900: 0x1b5e20,
    A100: 0xb9f6ca,
    A200: 0x69f0ae,
    A400: 0x00e676,
    A700: 0x00c853,
    color: () => convertToColor("Green"),
  },

  LightGreen: {
    C50: 0xf1f8e9,
    C100: 0xdcedc8,
    C200: 0xc5e1a5,
    C300: 0xaed581,
    C400: 0x9ccc65,
    C500: 0x8bc34a,
    C600: 0x7cb342,
    C700: 0x689f38,
    C800: 0x558b2f,
    C900: 0x33691e,
    A100: 0xccff90,
    A200: 0xb2ff59,
    A400: 0x76ff03,
    A700: 0x64dd17,
    color: () => convertToColor("LightGreen"),
  },

  Lime: {
    C50: 0xf9fbe7,
    C100: 0xf0f4c3,
    C200: 0xe6ee9c,
    C300: 0xdce775,
    C400: 0xd4e157,
    C500: 0xcddc39,
    C600: 0xc0ca33,
    C700: 0xafb42b,
    C800: 0x9e9d24,
    C900: 0x827717,
    A100: 0xf4ff81,
    A200: 0xeeff41,
    A400: 0xc6ff00,
    A700: 0xaeea00,
    color: () => convertToColor("Lime"),
  },

  Yellow: {
    C50: 0xfffde7,
    C100: 0xfff9c4,
    C200: 0xfff59d,
    C300: 0xfff176,
    C400: 0xffee58,
    C500: 0xffeb3b,
    C600: 0xfdd835,
    C700: 0xfbc02d,
    C800: 0xf9a825,
    C900: 0xf57f17,
    A100: 0xffff8d,
    A200: 0xffff00,
    A400: 0xffea00,
    A700: 0xffd600,
    color: () => convertToColor("Yellow"),
  },

  Amber: {
    C50: 0xfff8e1,
    C100: 0xffecb3,
    C200: 0xffe082,
    C300: 0xffd54f,
    C400: 0xffca28,
    C500: 0xffc107,
    C600: 0xffb300,
    C700: 0xffa000,
    C800: 0xff8f00,
    C900: 0xff6f00,
    A100: 0xffe57f,
    A200: 0xffd740,
    A400: 0xffc400,
    A700: 0xffab00,
    color: () => convertToColor("Amber"),
  },

  Orange: {
    C50: 0xfff3e0,
    C100: 0xffe0b2,
    C200: 0xffcc80,
    C300: 0xffb74d,
    C400: 0xffa726,
    C500: 0xff9800,
    C600: 0xfb8c00,
    C700: 0xf57c00,
    C800: 0xef6c00,
    C900: 0xe65100,
    A100: 0xffd180,
    A200: 0xffab40,
    A400: 0xff9100,
    A700: 0xff6d00,
    color: () => convertToColor("Orange"),
  },

  DeepOrange: {
    C50: 0xfbe9e7,
    C100: 0xffccbc,
    C200: 0xffab91,
    C300: 0xff8a65,
    C400: 0xff7043,
    C500: 0xff5722,
    C600: 0xf4511e,
    C700: 0xe64a19,
    C800: 0xd84315,
    C900: 0xbf360c,
    A100: 0xff9e80,
    A200: 0xff6e40,
    A400: 0xff3d00,
    A700: 0xdd2c00,
    color: () => convertToColor("DeepOrange"),
  },

  Brown: {
    C50: 0xefebe9,
    C100: 0xd7ccc8,
    C200: 0xbcaaa4,
    C300: 0xa1887f,
    C400: 0x8d6e63,
    C500: 0x795548,
    C600: 0x6d4c41,
    C700: 0x5d4037,
    C800: 0x4e342e,
    C900: 0x3e2723,
    color: () => convertToColor("Brown"),
  },

  Grey: {
    C50: 0xfafafa,
    C100: 0xf5f5f5,
    C200: 0xeeeeee,
    C300: 0xe0e0e0,
    C400: 0xbdbdbd,
    C500: 0x9e9e9e,
    C600: 0x757575,
    C700: 0x616161,
    C800: 0x424242,
    C900: 0x212121,
    color: () => convertToColor("Grey"),
  },

  BlueGrey: {
    C50: 0xeceff1,
    C100: 0xcfd8dc,
    C200: 0xb0bec5,
    C300: 0x90a4ae,
    C400: 0x78909c,
    C500: 0x607d8b,
    C600: 0x546e7a,
    C700: 0x455a64,
    C800: 0x37474f,
    C900: 0x263238,
    color: () => convertToColor("BlueGrey"),
  },

  Black: 0x000000,
  White: 0xffffff,
};

export const ColorUtils = {
  toHtml(color: number) {
    return `#${color.toString(16).padStart(6, "0")}`;
  },
  randomShade(exclude?: string): Shade {
    return Random.pick(this.randomColor(exclude).shades);
  },
  randomColor(exclude?: string): Color {
    let colors = ColorsArray;
    if (exclude) colors = colors.filter((p) => p.name !== exclude);

    return Random.pick(colors);
  },
};

type Shade = {
  name: string;
  shade: number;
};

export type Color = {
  name: string;
  shades: Shade[];
  highlights: Shade[];
};

function convertToColor(name: string): Color {
  const colorAny: any = Colors;
  const colorsObject = colorAny[name];
  const shades = Object.keys(colorsObject)
    .filter((name) => name.startsWith("C"))
    .map((s) => {
      return { name: s, shade: colorsObject[s] } as Shade;
    });

  const highlights = Object.keys(colorsObject)
    .filter((name) => name.startsWith("A"))
    .map((s) => {
      return { name: s, shade: colorsObject[s] };
    });

  return {
    name,
    shades,
    highlights,
  } as Color;
}

const colorAny: any = Colors;
const ColorsArray = Object.keys(Colors)
  .filter((c) => typeof colorAny[c] === "object")
  .map((name) => convertToColor(name));
