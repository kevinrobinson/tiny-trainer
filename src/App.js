import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import uuid from 'uuid/v4';
import './App.css';
import {loadModel, embeddingsFor} from './encoder';
import {teach} from './classify';


const demoLabels = [
  {id: 'a', text: 'smart phones' },
  {id: 'b', text: 'food and health' },
  {id: 'c', text: 'asking about age' },
];
const demoExamplesMap = {
  'a': [
    { id: 'a1', text: "I like my phone" },
    { id: 'a2', text: "My phone is not good." },
    { id: 'a3', text: "Your cellphone looks great." },
  ],
  'b': [
    { id: 'b1', text: "An apple a day, keeps the doctors away" },
    { id: 'b2', text: "Eating strawberries is healthy" },
    { id: 'b3', text: "Is paleo better than keto?" }
  ],
  'c': [
    { id: 'c1', text: "How old are you?" },
    { id: 'c2', text: "what is your age?" }
  ]
};
//   { id: 'b1', text: 'This is a sentence' },
//     { id: 'b2', text: 'This is truthful.' }
//   ],
//   'a2': [
//     { id: 'c1', text: 'What do you mean?'},
//     { id: 'c2', text: 'Are you confused?' },
//     { id: 'c3', text: 'How does this work?' },
//   ],
// }
const demoTestSentences = [
  'Which one is it?',
  'You think you can tell.',
  'But can you?'
];

// const demoResults = [ { "predictions": { "classIndex": 1, "confidences": { "0": 0, "1": 1 } }, "sentence": "Which one is it?" }, { "predictions": { "classIndex": 1, "confidences": { "0": 0.3333333333333333, "1": 0.6666666666666666 } }, "sentence": "You think you can tell." }, { "predictions": { "classIndex": 1, "confidences": { "0": 0.3333333333333333, "1": 0.6666666666666666 } }, "sentence": "But can you?" } ];

export default function App() {
  const [labels, setLabels] = useState(demoLabels);
  const [examplesMap, setExamplesMap] = useState(demoExamplesMap);
  const [trainingData, setTrainingData] = useState(null);
  const languageModel = usePromise(loadModel);
  const [results, setResults] = useState(null);

  // do training and prediction
  useEffect(() => {
    if (languageModel === null) return;
    if (trainingData === null) return;
    if (results !== null) return;
    teachableExamplesFor(languageModel, trainingData).then(teachableExamples => {
      console.log('teachableExamples', teachableExamples);
      const classifier = teach(teachableExamples);
      console.log('classifier', classifier);
      Promise.all(demoTestSentences.map(testSentence => {
        return embeddingsFor(languageModel, [testSentence]).then(testEmbeddings => {
          return classifier.predictClass(testEmbeddings).then(predictions => {
            console.log('predictions', predictions, testSentence);
            return {predictions, sentence: testSentence};
          });
        });
      })).then(setResults);
    });
  }, [languageModel, trainingData, results]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="App-bar">
          <button
            className="App-button"
            onClick={() => setLabels(labels.concat(newLabel()))}>
            Add label
          </button>
          <button
            className="App-button App-button-train"
            disabled={!languageModel}
            onClick={() => setTrainingData({labels, examplesMap})}>
            {(!trainingData || results) ? 'Train' : 'Training...'}
          </button>
        </div>
        <div className="App-buckets">
          <div style={{backgroundColor: 'red'}}>
            <LabelBucket
              label={labels[0]}
              labels={labels}
              setLabels={setLabels}
              examplesMap={examplesMap}
              setExamplesMap={setExamplesMap}
            />
          </div>
          <div className="App-results">
            {(results || []).map(result => (
              <div className="App-result" key={result.sentence}>
                <div>{result.sentence}</div>
                <div style={{top: 0, height: '100%', left: 0, background: 'red', opacity: 0.5, position: 'absolute', width: Math.floor(result.predictions.confidences['0']*100) + '%'}}></div>
                <div style={{top: 0, height: '100%', right: 0, background: 'blue', opacity: 0.5, position: 'absolute', width: Math.floor(result.predictions.confidences['1']*100) + '%'}}></div>
              </div>
            ))}
          </div>
          <div style={{backgroundColor: 'blue'}}>
            <LabelBucket
              label={labels[1]}
              labels={labels}
              setLabels={setLabels}
              examplesMap={examplesMap}
              setExamplesMap={setExamplesMap}
            />
          </div>
          {/*labels.map(label => (
            <LabelBucket
              label={label}
              labels={labels}
              setLabels={setLabels}
              examplesMap={examplesMap}
              setExamplesMap={setExamplesMap}
            />
          ))*/}
        </div>
      </header>
    </div>
  );
}

function newLabel() {
  return {
    id: uuid(),
    text: ''
  };
}

function newExample() {
  return {
    id: uuid(),
    text: ''
  }; 
}

function updatedRecords(labels, id, attrs) {
  return labels.map(label => {
    return (label.id === id)
      ? {...label, ...attrs}
      : label;
  });
}

function usePromise(promiseFn) {
  const [value, setValue] = useState(null);
  useEffect(() => {
    if (value !== null) return;
    promiseFn().then(setValue);
  }, [value]);

  return value;
}

function teachableExamplesFor(languageModel, trainingData) {
  const {labels, examplesMap} = trainingData;
  return Promise.all(_.flatMap(labels, (label, labelIndex) => {
    const examples = examplesMap[label.id];
    return examples.map(example => {
      return embeddingsFor(languageModel, [example.text]).then(embeddings => {
        return {embeddings, labelIndex};
      });
    });
  }));
}

function LabelBucket(props) {
  const {label, labels, setLabels, examplesMap, setExamplesMap} = props;
  const examples = examplesMap[label.id] || [];
  return (
    <div
      key={label.id}
      className="App-bucket">
      <div className="App-bucket-header">
        <input
          type="text"
          className="App-bucket-input"
          placeholder="Label..."
          value={label.text}
          onChange={e => {
            setLabels(updatedRecords(labels, label.id, {
              text: e.target.value
            }));
          }} />
        <button
          className="App-button"
          onClick={() => setLabels(_.without(labels, label))}>
          ×
        </button>
      </div>
      <div className="App-examples">
        {examples.map(example => (
          <div
            key={example.id}
            className="App-example">
            <textarea
              className="App-example-textarea"
              placeholder="Example..."
              value={example.text}
              onChange={e => {
                setExamplesMap({
                  ...examplesMap,
                  [label.id]: updatedRecords(examples, example.id, {
                    text: e.target.value
                  })
                })
              }}></textarea>
          </div>
        ))}
      </div>
      <button
        className="App-button"
        onClick={() => {
          setExamplesMap({
            ...examplesMap,
            [label.id]: examples.concat(newExample())
          });
        }}>
        Add example
      </button>
    </div>
  );
}