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
      <header className="app-header" style={{ textAlign: 'center' }}>
        <h1>Final Leaderboard</h1>
        <p>Congratulations to the winners!</p>
      </header>
      <div className="leaderboard-list">
        {sortedScores.length > 0 ? (
          sortedScores.map((player, index) => (
            <div key={player.id} className={`leaderboard-item ${getRankClass(index)}`}>
              <span className="rank">#{index + 1}</span>
              <span className="name">{player.fullName}</span>
              <span className="score">{player.score} pts</span>
            </div>
          ))
        ) : (
          <p style={{ color: '#666', fontSize: '1rem', marginTop: '20px' }}>
            No players yet. Waiting for students to join...
          </p>
        )}
      </div>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: 'linear-gradient(45deg, #6a82fb, #fc5c7d)',
            color: 'white',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '30px',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            marginTop: '30px',
            transition: 'all 0.3s',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(45deg, #fc5c7d, #6a82fb)'}
          onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(45deg, #6a82fb, #fc5c7d)'}
        >
          Back to Home
        </button>
      )}
    </div>
  );
}

export default Leaderboard;

