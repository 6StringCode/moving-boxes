'use client';

import { useState, useEffect } from 'react';

interface Box {
  id: number;
  number: number;
  room: string;
  contents: string;
  priority: string;
}

export default function Home() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [boxNumber, setBoxNumber] = useState('');
  const [room, setRoom] = useState('');
  const [contents, setContents] = useState('');
  const [priority, setPriority] = useState('Low');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBoxes();
  }, []);

  useEffect(() => {
    if (boxes.length > 0) {
      const maxNumber = Math.max(...boxes.map(b => b.number));
      setBoxNumber(String(maxNumber + 1));
    } else {
      setBoxNumber('1');
    }
  }, [boxes]);

  async function fetchBoxes() {
    try {
      const res = await fetch('/api/boxes');
      const data = await res.json();
      if (Array.isArray(data)) {
        setBoxes(data);
      } else {
        console.error('Expected array but got:', data);
        setBoxes([]);
      }
    } catch (error) {
      console.error('Error fetching boxes:', error);
      setBoxes([]);
    }
  }

  async function handleAddBox() {
    if (!boxNumber || !room || !contents) {
      alert('Please fill in box number, room, and contents');
      return;
    }

    setLoading(true);
    try {
      await fetch('/api/boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: parseInt(boxNumber),
          room,
          contents,
          priority,
        }),
      });

      setRoom('');
      setContents('');
      setPriority('Low');
      await fetchBoxes();
    } catch (error) {
      console.error('Error adding box:', error);
      alert('Failed to add box');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteBox(id: number) {
    setLoading(true);
    try {
      await fetch('/api/boxes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await fetchBoxes();
    } catch (error) {
      console.error('Error deleting box:', error);
      alert('Failed to delete box');
    } finally {
      setLoading(false);
    }
  }

  const highPriorityCount = boxes.filter(b => b.priority === 'High').length;

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>📦 Moving Box Tracker</h1>
          <p style={styles.headerSubtitle}>Keep track of all your boxes for an organized move</p>
        </div>

        <div style={styles.addSection}>
          <input
            type="number"
            value={boxNumber}
            onChange={(e) => setBoxNumber(e.target.value)}
            placeholder="Box #"
            min="1"
            style={styles.input}
          />
          <select
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            style={styles.select}
          >
            <option value="">Select Room</option>
            <option value="Kitchen">Kitchen</option>
            <option value="Living Room">Living Room</option>
            <option value="Bedroom">Bedroom</option>
            <option value="Bathroom">Bathroom</option>
            <option value="Office">Office</option>
            <option value="Garage">Garage</option>
            <option value="Basement">Basement</option>
            <option value="Attic">Attic</option>
            <option value="Other">Other</option>
          </select>
          <input
            type="text"
            value={contents}
            onChange={(e) => setContents(e.target.value)}
            placeholder="What's inside? (e.g., dishes, books, clothes)"
            style={{ ...styles.input, flex: 1, minWidth: '200px' }}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={styles.select}
          >
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
          </select>
          <button onClick={handleAddBox} disabled={loading} style={styles.button}>
            {loading ? 'Adding...' : 'Add Box'}
          </button>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Box #</th>
                <th style={styles.th}>Room</th>
                <th style={styles.th}>Contents</th>
                <th style={styles.th}>Priority</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {boxes.length === 0 ? (
                <tr style={styles.emptyState}>
                  <td colSpan={5} style={styles.td}>
                    <p>No boxes added yet</p>
                    <small>Start by adding your first box above!</small>
                  </td>
                </tr>
              ) : (
                boxes.map((box) => (
                  <tr key={box.id} style={styles.tr}>
                    <td style={{ ...styles.td, ...styles.boxNumber }}>{box.number}</td>
                    <td style={styles.td}>{box.room}</td>
                    <td style={styles.td}>{box.contents}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.priority,
                        ...(box.priority === 'High' ? styles.priorityHigh :
                          box.priority === 'Medium' ? styles.priorityMedium :
                            styles.priorityLow)
                      }}>
                        {box.priority}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleDeleteBox(box.id)}
                        disabled={loading}
                        style={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.stats}>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>{boxes.length}</div>
            <div style={styles.statLabel}>Total Boxes</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>{highPriorityCount}</div>
            <div style={styles.statLabel}>High Priority</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    padding: '20px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '30px',
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  headerSubtitle: {
    opacity: 0.9,
    fontSize: '14px',
  },
  addSection: {
    padding: '20px 30px',
    background: '#f8f9fa',
    borderBottom: '2px solid #e9ecef',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  input: {
    padding: '12px 16px',
    border: '2px solid #e9ecef',
    borderRadius: '6px',
    fontSize: '14px',
  },
  select: {
    padding: '12px 16px',
    border: '2px solid #e9ecef',
    borderRadius: '6px',
    fontSize: '14px',
  },
  button: {
    padding: '12px 16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  tableContainer: {
    overflowX: 'auto' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  thead: {
    background: '#f8f9fa',
  },
  th: {
    padding: '16px',
    textAlign: 'left' as const,
    fontWeight: '600',
    color: '#495057',
    borderBottom: '2px solid #dee2e6',
    fontSize: '13px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  td: {
    padding: '16px',
    borderBottom: '1px solid #e9ecef',
    fontSize: '14px',
  },
  tr: {
    transition: 'background 0.2s',
  },
  boxNumber: {
    fontWeight: '700',
    color: '#667eea',
    fontSize: '18px',
  },
  priority: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  priorityHigh: {
    background: '#fee',
    color: '#c00',
  },
  priorityMedium: {
    background: '#ffeaa7',
    color: '#d63031',
  },
  priorityLow: {
    background: '#dfe6e9',
    color: '#2d3436',
  },
  deleteBtn: {
    background: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  stats: {
    padding: '20px 30px',
    background: '#f8f9fa',
    display: 'flex',
    gap: '30px',
    flexWrap: 'wrap' as const,
    borderTop: '2px solid #e9ecef',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#667eea',
  },
  statLabel: {
    fontSize: '13px',
    color: '#6c757d',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  emptyState: {
    padding: '60px 30px',
    textAlign: 'center' as const,
    color: '#6c757d',
  },
};
