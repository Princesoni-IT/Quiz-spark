import React from 'react';
import './App.css';

function Leaderboard({ scores, onBack }) {
  // Scores ko descending order mein (zyada se kam) sort kiya
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  // Yeh function rank ke hisaab se styling dega
  const getRankClass = (index) => {
    if (index === 0) return 'rank-1'; // Gold for 1st
    if (index === 1) return 'rank-2'; // Silver for 2nd
    if (index === 2) return 'rank-3'; // Bronze for 3rd
    return '';
  };

  return (
    <div className="leaderboard-container">
      <header className="app-header">
        <h1>Final Leaderboard</h1>
        <p>Congratulations to the winners!</p>
      </header>
      <div className="leaderboard-list">
        {sortedScores.map((player, index) => (
          <div key={player.id} className={`leaderboard-item ${getRankClass(index)}`}>
            <span className="rank">#{index + 1}</span>
            <span className="name">{player.fullName}</span>
            <span className="score">{player.score} pts</span>
          </div>
        ))}
      </div>
      <button onClick={onBack} className="btn" style={{marginTop: '30px'}}>Back to Dashboard</button>
    </div>
  );
}

export default Leaderboard;

