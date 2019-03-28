import React from 'react';
import './TinyEmbedding.css';


export default function TinyEmbedding({embedding, style}) {
  const width = 1;
  return (
    <svg
      className="TinyEmbedding-svg"
      style={style}
      preserveAspectRatio="none"
      viewBox={`0 0 ${embedding.length} 100`}
    >
      {embedding.map((number, index) => {
        // TODO(kr) just guess about why these are negative, need
        // to learn more, this just assumes they're [-0.5, 0.5]
        const height = Math.round((0.5+number)*100);
        return (
          <rect
            className="TinyEmbedding-rect"
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