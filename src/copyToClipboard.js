import clipboardCopy from 'clipboard-copy';


export default async function copyToClipboard(classifier) {
  const d = classifier.getClassifierDataset();
  const tensors = await Promise.all(Object.keys(d).map(id => d[id].array()));
  const json = JSON.stringify(Object.keys(d).map((id, index) => {
    return {id, data: tensors[index]};
  }));

  const text = `
    <!-- Load TensorFlow.js -->
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
    <!-- see https://github.com/tensorflow/tfjs-models/tree/master/universal-sentence-encoder -->
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder"></script>
    <!-- see https://github.com/tensorflow/tfjs-models/tree/master/knn-classifier -->
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/knn-classifier"></script>

    <script id="tiny-trainer-copied-data" type="application/json">${json}</script>
    <script>
      (function() {
        function loadClassifier() {
          console.log('Loading classifier...');
          const json = JSON.parse(document.querySelector('#tiny-trainer-copied-data').innerHTML);
          const classifier = knnClassifier.create();
          const dataset = json.reduce((map, {id,data}) => {
            return {...map, [id]: tf.tensor(data)};
          }, {});
          console.log('dataset', dataset);
          classifier.setClassifierDataset(dataset);
          return classifier;
        }

        var classifier = null;
        var modelPromise = null;
        window.predict = function prediction(text) {
          classifier || (classifier = loadClassifier());
          if (!modelPromise) {
            console.log('Loading language model...');
            modelPromise = use.load();
          }

          console.log('Waiting for language model...');
          return modelPromise.then(model => {
            console.log('Embedding...');
            return model.embed([text]).then(embeddings => {
              console.log('embeddings', embeddings);
              console.log('Predicting...');
              return classifier.predictClass(embeddings);
            });
          });
        }
      })();
    </script>
  `;
  clipboardCopy(text);
  console.log(text);
}