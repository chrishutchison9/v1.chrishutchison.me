import React from "react";
import format from "date-fns/format";

export default class PostPreview extends React.Component {
  render() {
    const {entry, widgetFor} = this.props;

    return <section className="main"><div className="mw6 center ph3 pv4">
      <h1 className="f2 lh-title b mb3">{ entry.getIn(["data", "title"])}</h1>

      <div className="cms mw6">
        { widgetFor("body") }
      </div>
    </div></section>;
  }
}
