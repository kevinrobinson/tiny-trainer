import React, { useState, useEffect, useReducer } from 'react';
import {useQueryParam, StringParam} from 'use-query-params';
import _ from 'lodash';
import uuid from 'uuid/v4';
import qs from 'query-string';
import chroma from 'chroma-js';
import './App.css';
import * as tf from '@tensorflow/tfjs';
import {loadModel, embeddingsFor} from './encoder';
import {teach} from './classify';
import IngredientsLabel from './IngredientsLabel';
import Spinner from './Spinner';

const exampleDataSets = [
  'eyJsYWJlbHMiOlt7ImlkIjoiYSIsInRleHQiOiJzbWFydCBwaG9uZXMifSx7ImlkIjoiYiIsInRleHQiOiJmb29kIGFuZCBoZWFsdGgifSx7ImlkIjoiYyIsInRleHQiOiJhc2tpbmcgYWJvdXQgYWdlIn1dLCJleGFtcGxlc01hcCI6eyJhIjpbeyJpZCI6ImExIiwidGV4dCI6IkkgbGlrZSBteSBwaG9uZSJ9LHsiaWQiOiJhMiIsInRleHQiOiJNeSBwaG9uZSBpcyBub3QgZ29vZC4ifSx7ImlkIjoiYTMiLCJ0ZXh0IjoiWW91ciBjZWxscGhvbmUgbG9va3MgZ3JlYXQuIn1dLCJiIjpbeyJpZCI6ImIxIiwidGV4dCI6IkFuIGFwcGxlIGEgZGF5LCBrZWVwcyB0aGUgZG9jdG9ycyBhd2F5In0seyJpZCI6ImIyIiwidGV4dCI6IkVhdGluZyBzdHJhd2JlcnJpZXMgaXMgaGVhbHRoeSJ9LHsiaWQiOiJiMyIsInRleHQiOiJJcyBwYWxlbyBiZXR0ZXIgdGhhbiBrZXRvPyJ9XSwiYyI6W3siaWQiOiJjMSIsInRleHQiOiJIb3cgb2xkIGFyZSB5b3UifV19fQ==',
  'eyJsYWJlbHMiOlt7ImlkIjoiYSIsInRleHQiOiJwbGFuZXMifSx7ImlkIjoiYiIsInRleHQiOiJwb2xpdGljcyJ9LHsiaWQiOiJjIiwidGV4dCI6ImVjb25vbXkifV0sImV4YW1wbGVzTWFwIjp7ImEiOlt7ImlkIjoiYTEiLCJ0ZXh0IjoiSW52ZXN0aWdhdGlvbiBpbnRvIHRoZSBCb2VpbmcgcGxhbmUgY3Jhc2guIn0seyJpZCI6ImEyIiwidGV4dCI6IkFpcmxpbmVzIG1ha2UgbW9uZXkgc2VsbGluZyB0aWNrZXRzLiJ9LHsiaWQiOiJhMyIsInRleHQiOiJGbGlnaHQgZGVsYXlzIGFyZSBleHBlY3RlZCB3aXRoIHNub3cgdGhpcyB3ZWVrZW5kLiJ9XSwiYiI6W3siaWQiOiJiMSIsInRleHQiOiJOb3J0aCBLb3JlYSBuZWdvdGlhdGlvbnMuIn0seyJpZCI6ImIyIiwidGV4dCI6IlRoZSBXaGl0ZSBIb3VzZSBhbmQgQ29uZ3Jlc3MgYXJlIGluIG5lZ290aWF0aW9ucy4ifSx7ImlkIjoiYjMiLCJ0ZXh0IjoiVGhlIGJpbGwgaXMgbm90IGV4cGVjdGVkIHRvIHBhc3MsIHRoZSBwcmVzaWRlbnQgd2lsbCB2ZXRvIGl0LiJ9XSwiYyI6W3siaWQiOiJjMSIsInRleHQiOiJJbmZsYXRpb24gbG9va3Mgc3RhYmxlLCBzYXlzIHRoZSBGZWQuIn0seyJpZCI6ImMyIiwidGV4dCI6IlVuZW1wbG95bWVudCBpcyBsb3cgYnV0IHdhZ2VzIGFyZSBub3QgcmlzaW5nIGxpa2UgdGhleSB1c2VkIHRvLiJ9XX19',
  'eyJsYWJlbHMiOlt7ImlkIjoiYSIsInRleHQiOiJzb2NjZXIifSx7ImlkIjoiYiIsInRleHQiOiJiYXNlYmFsbCJ9LHsiaWQiOiJjIiwidGV4dCI6ImhvY2tleSJ9XSwiZXhhbXBsZXNNYXAiOnsiYSI6W3siaWQiOiJhMSIsInRleHQiOiJNZXNzaSBuZWdvdGlhdGluZyBuZXcgY29udHJhY3QuIn0seyJpZCI6ImEyIiwidGV4dCI6Ik5ldyBHcmllem1hbm4gZG9jdW1lbnRhcnkgc2hvd3MgdGhlIGpvdXJuZXkgb2YgYSBzdGFyLiJ9LHsiaWQiOiJhMyIsInRleHQiOiJGSUZBIGhhcyB5ZXQgYW5vdGhlciBicmliZXJ5IHNjYW5kYWwuIn1dLCJiIjpbeyJpZCI6ImIxIiwidGV4dCI6IlRoZSBSZWQgU294IGFyZSB0YWtpbmcgb24gdGhlIEN1YnMgaW4gQXJpem9uYS4ifSx7ImlkIjoiYjIiLCJ0ZXh0IjoiU2FsZSByZWFkeSB0byBzdGFydCB0aGUgc2Vhc29uLiJ9LHsiaWQiOiJiMyIsInRleHQiOiJQaXRjaGluZyBpcyBtb3JlIGltcG9ydGFudCB0aGFuIGV2ZXIgdGhpcyB5ZWFyIGluIHRoZSBOTC4ifV0sImMiOlt7ImlkIjoiYzEiLCJ0ZXh0IjoiQnJ1aW5zIGFuZCBDYW5hZGllbnMgdHJhZGUgamFicy4ifSx7ImlkIjoiYzIiLCJ0ZXh0IjoiSWNpbmcgcnVsZXMgdW5kZXIgZGViYXRlIGluIFRvcm9udG8uIn1dfX0='
];


export default function App() {
  const [labels, setLabels] = useState([]);
  const [examplesMap, setExamplesMap] = useState({});
  const [trainingData, setTrainingData] = useState(null);
  const [languageModel, setLanguageModel] = useState(null);
  const [classifier, setClassifier] = useState(null);
  const [results, setResults] = useState(null);
  const [feedKey, setFeedKey] = useState('associated-press')
  const [testSentences, setTestSentences] = useState([]);  
  const [q, setQ] = useQueryParam('q', StringParam);
  const showEmbedding = false;

  // logging
  const [{isVisible, logs}, dispatch] = useReducer(logReducer, {
    logs: [],
    isVisible: false
  });
  const log = (...payload) => dispatch({type: 'log', payload});

  // load USE model
  useEffect(() => {
    if (languageModel !== null) return;
    log('Loading languageModel...');
    loadModel()
      .then(setLanguageModel)
      .then(() => log('languageModel loaded.'));
  }, [languageModel]);

  // query string
  const [hasReadQueryString, setHasReadQueryString] = useState(false);
  useEffect(() => {
    if (hasReadQueryString) return;

    log('readQueryString', feedKey);
    const queryString = qs.parse(window.location.search);
    const q = queryString.q || _.sample(exampleDataSets);
    const json = JSON.parse(atob(q));
    const {labels, examplesMap} = json;
    setExamplesMap(examplesMap);
    setLabels(labels);
    setHasReadQueryString(true);
  }, [hasReadQueryString, q]);

  useEffect(() => {
    window.history.replaceState(null, null, '?q=' + btoa(JSON.stringify({labels, examplesMap})));
  }, [labels, examplesMap]);

  // fetching news, clear any results too
  useEffect(() => {
    log('fetchRecentArticles...', feedKey);
    fetchRecentArticles(feedKey)
      .then(setTestSentences)
      .then(() => setResults(null))
      .then(() => log('fetchRecentArticles done.'));
  }, [feedKey]);


  // do training
  const [isTraining, setIsTraining] = useState(false);
  useEffect(() => {
    const shouldTrainClassifier = (
      (languageModel !== null) &&
      (trainingData !== null) &&
      (classifier === null) &&
      (!isTraining)
    );
    if (!shouldTrainClassifier) return;

    log("\nTraining...");
    setIsTraining(true);
    setTimeout(() => { // yield a tick since otherwise UI doesn't update
      teachableExamplesFor(languageModel, trainingData)
        .then(teachableExamples => teach(teachableExamples))
        .then(setClassifier)
        .then(() => log('Training done.'))
        .then(() => setIsTraining(false));
    }, 20);
  }, [isTraining, trainingData, languageModel, classifier]);

  // do prediction
  // TODO(kr) doesn't abort properly
  const [isPredicting, setIsPredicting] = useState(false);  
  useEffect(() => {
    const shouldPredict = (
      (!isTraining) &&
      (classifier !== null) &&
      (results === null) &&
      (!isPredicting)
    );
    if (!shouldPredict) return;

    setIsPredicting(true);
    log('\nPredicting, mapping to embeddings...');
    embeddingsFor(languageModel, testSentences).then(embeddingsT => {
      log('Predicting, reading embeddings...');
      return embeddingsT.array().then(embeddings => {
        log('Predicting, classifying...');
        return Promise.all(embeddings.map((embedding, index) => {
          return classifier.predictClass(tf.tensor(embedding)).then(predictions => {
            const sentence = testSentences[index];
            return {embedding, predictions, sentence};
          });
        }));
      });
    }).then(setResults)
      .then(() => log('Predicting done.'))
      .then(() => setIsPredicting(false));
  }, [isTraining, isPredicting, testSentences, classifier, results]);

  // Some bug here with UI not updating, even though
  // this is as expected.  React scheduler or browser GPU?
  // It happens in Safari but noot Chrome, so maybe browser side?
  const buttonText = isTraining
    ? 'Training...'
    : isPredicting
      ? 'Predicting...'
      : 'Train and Predict';
  return (
    <div className="App">
      <header className="App-header">
        <div className="App-bar">
          <span style={{marginRight: 40}}>Training data</span>
          <button
            className="App-button"
            style={{color: '#eee', display: 'inline-block'}}
            onClick={() => {
              if (!window.confirm('This will reset your work.  Load?')) return;
              setHasReadQueryString(false);
              setQ(_.sample(exampleDataSets));
            }}>
            Load example
          </button>
          <button
            className="App-button"
            style={{color: '#eee', display: 'inline-block'}}
            onClick={() => {
              if (!window.confirm('This will drop the dataset.  Clear?')) return;
              setLabels([newLabel()]);
              setExamplesMap({});
            }}>
            Clear
          </button>
          <button
            className="App-button"
            style={{color: '#eee', display: 'inline-block'}}
            onClick={() => setLabels(labels.concat(newLabel()))}>
            Add label
          </button>
        </div>
        <div className="App-buckets">
          {labels.map((label, labelIndex) => (
            <LabelBucket
              key={label.id}
              label={label}
              labelIndex={labelIndex}
              labels={labels}
              setLabels={setLabels}
              examplesMap={examplesMap}
              setExamplesMap={setExamplesMap}
            />
          ))}
        </div>
        <div className="App-training">
          <div>
            <button
              className="App-button App-button-train"
              style={{display: 'inline-block'}}
              disabled={!languageModel || isTraining || isPredicting}
              onClick={() => {
                log('\nclick:setTrainingData...');
                setTrainingData({labels, examplesMap});
                log('click:setClassifier...');
                setClassifier(null);
                log('click:setResults...');
                setResults(null);
              }}>
              {buttonText}
            </button>
            <button className="App-button"
              style={{marginLeft: 20, color: '#eee', display: 'inline-block'}}
              onClick={() => dispatch({type: 'toggle'})}>
              Show logs
            </button>
          </div>
          <Spinner style={{opacity: (isTraining || isPredicting) ? 1 : 0}} />
        </div>
        {isVisible && <pre className="App-debug">{logs}</pre>}
        <div className="App-results">
          <div style={{marginBottom: 10}}>
            <span style={{marginRight: 10}}>Test data from</span>
            <SelectFeed feedKey={feedKey} setFeedKey={setFeedKey} />
            <span> via <a target="_blank" rel="noopener noreferrer" style={{color: '#eee'}} href="https://newsapi.org">newsapi.org</a>, or edit yourself!</span>
          </div>
          {!results && testSentences.map((sentence, sentenceIndex) => (
            <div className="App-sentence" key={sentenceIndex}>
              <input
                type="text"
                className="App-test-sentence-input"
                disabled={isTraining || isPredicting}
                onChange={e => setTestSentences(updatedList(testSentences, sentence, e.target.value))}
                value={sentence}
              />
              <button
                className="App-button"
                style={{
                  position: 'absolute',
                  left: -40,
                  display: (isTraining || isPredicting) ? 'none' : 'auto'
                }}
                onClick={() => setTestSentences(_.without(testSentences, sentence))}>
                ×
              </button>
            </div>
          ))}
          {(results || []).map(result => (
            <div key={result.sentence}>
              <div className="App-result">
                <div>{result.sentence}</div>
                <div style={{
                  marginTop: 10,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-end'
                }}>
                  {Object.keys(result.predictions.confidences).map(classIndex => {
                    const rating = result.predictions.confidences[classIndex];
                    return (
                      <div key={classIndex} style={{
                        flex: 1,
                        background: chroma(colors[classIndex]).alpha(rating),
                        color: chroma('#333').alpha(rating),
                        padding: 2,
                        height: 10,
                        fontSize: 10
                      }}>{Math.round(rating * 100)}%</div>
                    );
                  })}
                </div>
              </div>
              {showEmbedding && <TinyEmbedding embedding={result.embedding} />}
            </div>
          ))}
          <div className="App-ingredients"><ProjectIngredients /></div>
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

function updatedList(items, oldItem, newItem) {
  const index = items.indexOf(oldItem);
  const updated = items.slice(0);
  updated.splice(index, 1, newItem);
  return updated;
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
  const {label, labelIndex, labels, setLabels, examplesMap, setExamplesMap} = props;
  const examples = examplesMap[label.id] || [];
  return (
    <div
      key={label.id}
      className="App-bucket">
      <div className="App-bucket-header" style={{backgroundColor: colors[labelIndex]}}>
        <input
          type="text"
          className="App-bucket-input"
          style={{backgroundColor: colors[labelIndex]}}
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
              style={{
                backgroundColor: chroma(colors[labelIndex]).alpha(0.5)
              }}
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
        style={{marginTop: 10, marginBottom: 20, color: 'black'}}
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

function TinyEmbedding({embedding}) {
  const width = 1;
  return (
    <svg
      className="App-embedding-svg"
      width="100%"
      height={30}
      preserveAspectRatio="none"
      viewBox={`0 0 ${embedding.length} 100`}
    >
      {embedding.map((number, index) => {
        // TODO(kr) just guess about why these are negative, need
        // to learn more, this just assumes they're [-0.5, 0.5]
        const height = Math.round((0.5+number)*100);
        return (
          <rect
            className="App-embedding-rect"
            key={index}
            x={width * index}
            y={100 - height}
            width={width}
            height={height}
          />
        );
      })}
    </svg>
  );
}
const colors = [
  '#31AB39',
  '#EB4B26',
  '#139DEA',
  // '#333333',
  '#CDD71A',
  '#6A2987',
  '#fdbf6f',
  '#ff7f00',
  '#cab2d6',
  '#6a3d9a',
  '#ffff99',
  '#b15928'
];


function fetchRecentArticles(feedKey) {
  const apiKey = 'ff6d0ce2e73f4f7a88a9a402f1994777';
  const url = `https://newsapi.org/v2/top-headlines?sources=${feedKey}&apiKey=${apiKey}`;
  return fetch(url)
    .then(r => r.json())
    .then(json => json.articles.map(a => a.title));
}

function ProjectIngredients() {
  return (
    <IngredientsLabel
      dataSets={<div><a target="_blank" rel="noopener noreferrer" href="https://arxiv.org/abs/1803.11175">Web sources (eg, Wikipedia, news and Q&A sites)</a> by Google</div>}
      preTrainedModels={<div><a target="_blank" rel="noopener noreferrer" href="https://github.com/tensorflow/tfjs-models/tree/master/universal-sentence-encoder">Universal Sentence Encoder lite</a> by Google</div>}
      architectures={<div>
        <div><a target="_blank" rel="noopener noreferrer" href="https://arxiv.org/pdf/1706.03762.pdf">Transformer</a> by Google</div>
        <div><a target="_blank" rel="noopener noreferrer" href="https://github.com/tensorflow/tfjs-models/tree/master/knn-classifier">KNN Classifier</a> by Google</div>
      </div>}
      tunings={<div><a target="_blank" rel="noopener noreferrer" href="https://github.com/kevinrobinson/tiny-trainer">tiny-trainer</a> by <a target="_blank" rel="noopener noreferrer" href="https://github.com/kevinrobinson">Kevin Robinson</a></div>}
    />
  );
}
function SelectFeed({feedKey, setFeedKey}) {
  return (
    <select value={feedKey} onChange={e => setFeedKey(e.target.value)}>
      <option value="associated-press">Associated Press</option>
      <option value="ign">IGN</option>
      <option value="bleacher-report">Bleacher Report</option>
      <option value="the-new-york-times">New York Times</option>
      <option value="the-times-of-india">Times of India</option>
    </select>
  );
}

function logReducer(state, action) {
  const {isVisible, logs} = state;
  const {type} = action;

  if (type ===  'log') {
    const args = action.payload;
    const output = args.map(arg => _.isObject(arg) ? JSON.stringify(arg) : arg).join(' ') + "\n";
    console.debug('logReducer:', output);
    return {...state, logs: logs.concat(output)};
  }

  if (type ===  'toggle') {
    return {...state, isVisible: !isVisible};
  }
  throw new Error(`unexpected type: ${type}`)
}
