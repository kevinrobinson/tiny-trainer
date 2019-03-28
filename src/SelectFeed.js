import React from 'react';

export default function SelectFeed({feedKey, setFeedKey}) {
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

