
import "./style.css";

export default class UploadVideo {
  constructor({ data, config, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;

  }

  get data() {
    return this._data;
  }

  set data(data) {
    this._data = Object.assign({}, this.data, data);

    // if (this.nodes.image) {
    //   this.nodes.image.src = this.data.url;
    // }

    // if (this.nodes.caption) {
    //   this.nodes.caption.innerHTML = this.data.caption;
    // }
  }

  static get sanitize() {
    return {
      url: {},
      withBorder: {},
      withBackground: {},
      stretched: {},
      caption: {
        br: true,
      },
      a: {
        href: true,
      },
      b: {},
    };
  }

  /**
 * Notify core that read-only mode is suppoorted
 * @returns {boolean}
 */
  static get isReadOnlySupported() {
    return true;
  }

}
