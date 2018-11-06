'use strict';

import { fetchGoogle } from "/google/google.js"

const e = React.createElement;

class Survey extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      page: 'consent',
      device: null,
      url: '',
      transcript: '',
      color: '',
      feeling: ''
    };
  }

  selectRecording() {
    chrome.storage.local.get('audio', result => {
      const data = result.audio;
      const index = Math.floor(Math.random() * data.length);
      this.setState({ url: data[index][24][0] });
      this.setState({ transcript: data[index][9][0] });
    });
  }

  render() {
    if (this.state.page === 'consent') {
      return e(
        'div',
        null,
        e('p', null, 'consent stuff'),
        e(
          'button',
          {
            id: 'consent',
            onClick: () => this.setState({ page: 'device' })
          },
          'Agree'
        )
      )
    }

    if (this.state.page === 'device') {
      return e(
        "div",
        null,
        e("h1", null, "Which Device do you own?"),
        e("br", null),
        e("br", null),
        e(
          "button",
          {
            id: "alexa",
            onClick: () => this.setState({ page: 'recording', device: 'alexa' })
          },
          "I own an Amazon Echo or Echo Dot"
        ),
        e("br", null),
        e("br", null),
        e(
          "button",
          {
            id: "google",
            onClick: () => {
              fetchGoogle(() => this.selectRecording());
              this.setState({ page: 'question', device: 'google' });
            }
          },
          "I own a Google Home"
        )
      );
    }

    if (this.state.page === 'question') {
      return e(
        'div',
        null,
        e('h3', null, "What's your favorite color?"),
        e(
          'button',
          { onClick: () => this.setState({ page: 'recording', color: 'Blue' }) },
          'Blue'
        ),
        e(
          'button',
          { onClick: () => this.setState({ page: 'recording', color: 'Red' }) },
          'Red'
        )
      );
    }

    if (this.state.page === 'recording') {
      if (this.state.device === 'alexa') {
        return e(
          'button',
          { onClick: () => this.setState({ page: 'device', device: null }) },
          "Go back"
        );
      }

      return e(
        "div",
        null,
        e(
          "button",
          {
            id: "select",
            onClick: () => this.selectRecording()
          },
          "Select new recording"
        ),
        e('br', null),
        e("h1", null, "Sample"),
        e(
          "audio",
          { id: "audio", src: this.state.url, controls: true },
          "Your browser does not support the ",
          e("code", null, "audio"),
          " element."
        ),
        e("h1", null, "Transcript"),
        e("p", { id: "transcript" }, this.state.transcript),
        e('br', null),
        e('h3', null, 'How do you feel about this recording?'),
        e(
          'button',
          { onClick: () => this.setState({ page: 'conclusion', feeling: 'Nice' }) },
          'Nice'
        ),
        e(
          'button',
          { onClick: () => this.setState({ page: 'conclusion', feeling: 'Yikes' }) },
          'Yikes'
        )
      );
    }

    if (this.state.page === 'conclusion') {
      return e(
        'div',
        null,
        e('h3', null, "Here's what you answered!"),
        e('p', null, `Favorite color: ${this.state.color}`),
        e('p', null, `Feeling: ${this.state.feeling}`),
        e(
          'button',
          { onClick: () => this.setState({ page: 'end' }) },
          'Finish'
        )
      );
    }

    return e(
      'button',
      { onClick: () => this.setState({ page: 'consent' }) },
      'Go back to the beginning'
    );
  }
}

const domContainer = document.querySelector('#page');
ReactDOM.render(e(Survey), domContainer);
