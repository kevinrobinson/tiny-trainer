import React, {useState, useEffect} from 'react';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import BoxEmbedding from './BoxEmbedding';
import TinyEmbedding from './TinyEmbedding';
import Spinner from './Spinner';


export default function Peek() {
  const [text, setText] = useState('dogs are great!');
  const [texts, setTexts] = useState([
    'cats are great!'
  ]);
  return (
    <div style={{padding: 20, margin: 10, width: 1000, backgroundColor: '#282c34'}}>
      <h1 style={{color: 'orange'}}>add some words...</h1>
      <div style={{display: 'flex', flexDirection: 'row', marginBottom: 40}}>
        <textarea
          style={{padding: 10, fontSize: 18, width: '80%'}}
          rows={3}
          placeholder="Type something..."
          value={text}
          onChange={e => setText(e.target.value)} />
        <button
          style={{
            padding: 10,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            color: '#eee'
          }}
          onClick={e => {
            setTexts(texts.concat([text]));
            setText('');
          }}>add</button>
      </div>
      <h1 style={{color: 'orange'}}>...peek inside</h1>
      <table>
        <thead>
          <tr>
            <th style={{width: 250}}><h3 style={{color: 'orange'}}>input text</h3></th>
            <th style={{width: 150}}><h3 style={{color: 'orange'}}>tokens</h3></th>
            <th style={{width: 450}}><h3 style={{color: 'orange'}}>embeddings (box, flat)</h3></th>
            <th style={{width: 150}}><h3 style={{color: 'orange'}}>predictions</h3></th>
          </tr>
        </thead>
        <tbody>
          {texts.map(text => <Row key={text} text={text} />)}
        </tbody>
      </table>
    </div>
  );
}


function Row({text}) {
  const [tokens, setTokens] = useState(null);
  const [embedding, setEmbedding] = useState(null);
  
  useEffect(() => {
    use.loadTokenizer()
      .then(tokenizer => tokenizer.encode(text))
      .then(setTokens)

    use.load()
      .then(model => model.embed(text))
      .then(e => e.array())
      .then(e => e[0])
      .then(setEmbedding)
  }, [text]);

  return (
    <tr>
      <td style={{verticalAlign: 'bottom'}}>
        {tokens && <div style={{fontSize: 12, color: '#ccc', marginBottom: 10}}>{tokens.length} words</div>}
        <div style={{padding: 10, fontSize: 14, color: '#333', background: '#f8f8f8'}}>{text}</div>
      </td>
      <td style={{textAlign: 'center', verticalAlign: 'bottom'}}>
        {!tokens ? <Spinner /> : (
          <div style={{fontSize: 12, color: '#ccc'}}>
            <code>{tokens.map(t => padStart(t.toString(), 4, '0')).join(', ')}</code>
          </div>
        )}
      </td>
      <td style={{textAlign: 'center', height: 120, verticalAlign: 'bottom'}}>
        {!embedding ? <Spinner /> : (
          <div>
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-end'}}>
              <BoxEmbedding embedding={embedding} style={{background: 'white', width: 80, height: 80, marginRight: 20}} />
              <div>
                <div style={{margin: 20, fontSize: 12, color: '#ccc'}}>{embedding.length} dimensions</div>
                <TinyEmbedding embedding={embedding} style={{background: 'white', width: 300, height: 50}} />
              </div>
            </div>
          </div>
        )}
      </td>
      <td></td>
    </tr>
  );
}


// https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
function padStart(string, targetLength, padString) {
  targetLength = targetLength >> 0; //truncate if number, or convert non-number to 0;
  padString = String(typeof padString !== 'undefined' ? padString : ' ');
  if (string.length >= targetLength) {
    return String(string);
  } else {
    targetLength = targetLength - string.length;
    if (targetLength > padString.length) {
      padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
    }
    return padString.slice(0, targetLength) + String(string);
  }
}
