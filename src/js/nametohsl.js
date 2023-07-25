/**
 * Convert name to HSL color
 *
 * @class NameToHSL
 */
export default class NameToHSL {
  ranges = {
    h: [0, 360], s: [20, 70], l: [20, 40]
  }
  
  /*Initialization*/
  constructor (data) {
    this.ranges = {
      h: data?.h || this.ranges.h,
      s: data?.s || this.ranges.s,
      l: data?.l || this.ranges.l,
    };
  }
  
  /**
   * Make hash from string
   *
   * @param str {string}
   * @returns {number}
   */
  getHashOfString(str) {
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return Math.abs(hash);
  }
  
  /**
   * Normalize hash
   *
   * @param hash {number}
   * @param min {number}
   * @param max {number}
   * @returns {number}
   */
  normalizeHash(hash, min, max) {
    return Math.floor((hash % (max - min)) + min);
  }
  
  /**
   * Generating string hsl(h, s%, l%)
   *
   * @param name {string}
   * @returns {hsl([number,string,string])}
   */
  generateHSL(name) {
    const
      hash = this.getHashOfString(name),
      h = this.normalizeHash(hash, this.ranges.h[0], this.ranges.h[1]),
      s = this.normalizeHash(hash, this.ranges.s[0], this.ranges.s[1]),
      l = this.normalizeHash(hash, this.ranges.l[0], this.ranges.l[1]);
    
    return `hsl(${ [h, `${ s }%`, `${ l }%`].toString() })`;
  }
}