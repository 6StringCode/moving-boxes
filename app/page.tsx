'use client';

import { useState, useEffect } from 'react';

interface Box {
  id: number;
  number: number;
  room: string;
  contents: string;
  image_url?: string | null;
  hidden?: boolean;
}

export default function Home() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [boxNumber, setBoxNumber] = useState('');
  const [room, setRoom] = useState('');
  const [contents, setContents] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRoom, setEditRoom] = useState('');
  const [editContents, setEditContents] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'packed' | 'unpacked'>('packed');
  const [sortBy, setSortBy] = useState<'number' | 'room'>('number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchBoxes();
  }, [activeTab, sortBy, sortDirection]);

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
      // Fetch all boxes and filter on the client side based on active tab
      const res = await fetch(`/api/boxes?includeHidden=true`);
      const data = await res.json();
      if (Array.isArray(data)) {
        // Filter based on active tab
        const filteredBoxes = data.filter(box =>
          activeTab === 'packed' ? !box.hidden : box.hidden
        );

        // Sort the boxes
        const sortedBoxes = [...filteredBoxes].sort((a, b) => {
          if (sortBy === 'number') {
            return sortDirection === 'asc' ? a.number - b.number : b.number - a.number;
          } else {
            // Sort by room
            const roomA = a.room.toLowerCase();
            const roomB = b.room.toLowerCase();
            if (sortDirection === 'asc') {
              return roomA < roomB ? -1 : roomA > roomB ? 1 : 0;
            } else {
              return roomA > roomB ? -1 : roomA < roomB ? 1 : 0;
            }
          }
        });

        setBoxes(sortedBoxes);
      } else {
        console.error('Expected array but got:', data);
        setBoxes([]);
      }
    } catch (error) {
      console.error('Error fetching boxes:', error);
      setBoxes([]);
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleEditImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function uploadImage(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  }

  async function handleAddBox() {
    if (!boxNumber || !room || !contents) {
      alert('Please fill in box number, room, and contents');
      return;
    }

    setLoading(true);
    try {
      let image_url = null;

      // Upload image if one was selected
      if (imageFile) {
        image_url = await uploadImage(imageFile);
      }

      await fetch('/api/boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: parseInt(boxNumber),
          room,
          contents,
          image_url,
        }),
      });

      setRoom('');
      setContents('');
      setImageFile(null);
      setImagePreview(null);
      await fetchBoxes();
    } catch (error) {
      console.error('Error adding box:', error);
      alert('Failed to add box');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateBox(id: number, currentImageUrl?: string | null) {
    if (!editRoom || !editContents) {
      alert('Please fill in room and contents');
      return;
    }

    setLoading(true);
    try {
      let image_url = currentImageUrl;

      // Upload new image if one was selected
      if (editImageFile) {
        image_url = await uploadImage(editImageFile);
      }

      await fetch('/api/boxes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          room: editRoom,
          contents: editContents,
          image_url,
        }),
      });

      setEditingId(null);
      setEditRoom('');
      setEditContents('');
      setEditImageFile(null);
      setEditImagePreview(null);
      await fetchBoxes();
    } catch (error) {
      console.error('Error updating box:', error);
      alert('Failed to update box');
    } finally {
      setLoading(false);
    }
  }

  function startEditing(box: Box) {
    setEditingId(box.id);
    setEditRoom(box.room);
    setEditContents(box.contents);
    setEditImagePreview(box.image_url || null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditRoom('');
    setEditContents('');
    setEditImageFile(null);
    setEditImagePreview(null);
  }

  async function handleDeleteBox(id: number) {
    if (!confirm('Are you sure you want to delete this box?')) {
      return;
    }

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

  async function handleToggleHidden(id: number, currentHidden: boolean) {
    setLoading(true);
    try {
      await fetch('/api/boxes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggleHidden',
          id,
          hidden: !currentHidden,
        }),
      });
      await fetchBoxes();
    } catch (error) {
      console.error('Error toggling box visibility:', error);
      alert('Failed to update box visibility');
    } finally {
      setLoading(false);
    }
  }

  function handleSort(column: 'number' | 'room') {
    if (sortBy === column) {
      // Toggle direction if already sorting by this column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortBy(column);
      setSortDirection('asc');
    }
  }

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>📦 Moving Box Tracker</h1>
          <p style={styles.headerSubtitle}>Keep track of all your boxes for an organized move</p>
          <div style={styles.tabContainer}>
            <button
              onClick={() => setActiveTab('packed')}
              style={{
                ...styles.tabButton,
                ...(activeTab === 'packed' ? styles.tabButtonActive : {}),
              }}
            >
              📦 Packed Boxes
            </button>
            <button
              onClick={() => setActiveTab('unpacked')}
              style={{
                ...styles.tabButton,
                ...(activeTab === 'unpacked' ? styles.tabButtonActive : {}),
              }}
            >
              ✅ Unpacked Boxes
            </button>
          </div>
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
            <option value="Dining Room">Dining Room</option>
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
          <div style={styles.imageUploadContainer}>
            <label style={styles.imageLabel}>
              📷 Photo (optional)
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                style={styles.fileInput}
              />
            </label>
            {imagePreview && (
              <img src={imagePreview} alt="Preview" style={styles.imagePreview} />
            )}
          </div>
          <button onClick={handleAddBox} disabled={loading} style={styles.button}>
            {loading ? 'Adding...' : 'Add Box'}
          </button>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th
                  style={{ ...styles.th, ...styles.sortableHeader }}
                  onClick={() => handleSort('number')}
                >
                  Box # {sortBy === 'number' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={styles.th}>Image</th>
                <th
                  style={{ ...styles.th, ...styles.sortableHeader }}
                  onClick={() => handleSort('room')}
                >
                  Room {sortBy === 'room' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={styles.th}>Contents</th>
                <th style={styles.th}>Actions</th>
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
                    <td style={styles.td}>
                      {editingId === box.id ? (
                        <div>
                          {editImagePreview && (
                            <img src={editImagePreview} alt="Box" style={styles.tableThumbnail} />
                          )}
                          <label style={styles.smallImageLabel}>
                            Change Photo
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handleEditImageSelect}
                              style={styles.fileInput}
                            />
                          </label>
                        </div>
                      ) : box.image_url ? (
                        <img src={box.image_url} alt="Box" style={styles.tableThumbnail} />
                      ) : (
                        <span style={styles.noImage}>No image</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {editingId === box.id ? (
                        <select
                          value={editRoom}
                          onChange={(e) => setEditRoom(e.target.value)}
                          style={styles.editInput}
                        >
                          <option value="">Select Room</option>
                          <option value="Kitchen">Kitchen</option>
                          <option value="Dining Room">Dining Room</option>
                          <option value="Living Room">Living Room</option>
                          <option value="Bedroom">Bedroom</option>
                          <option value="Bathroom">Bathroom</option>
                          <option value="Office">Office</option>
                          <option value="Garage">Garage</option>
                          <option value="Basement">Basement</option>
                          <option value="Attic">Attic</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        box.room
                      )}
                    </td>
                    <td style={styles.td}>
                      {editingId === box.id ? (
                        <input
                          type="text"
                          value={editContents}
                          onChange={(e) => setEditContents(e.target.value)}
                          style={styles.editInput}
                        />
                      ) : (
                        box.contents
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        {editingId === box.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateBox(box.id, box.image_url)}
                              disabled={loading}
                              style={styles.saveBtn}
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              disabled={loading}
                              style={styles.cancelBtn}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(box)}
                              disabled={loading}
                              style={styles.editBtn}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleHidden(box.id, box.hidden || false)}
                              disabled={loading}
                              style={box.hidden ? styles.unhideBtn : styles.hideBtn}
                            >
                              {box.hidden ? 'Unhide' : 'Hide'}
                            </button>
                            <button
                              onClick={() => handleDeleteBox(box.id)}
                              disabled={loading}
                              style={styles.deleteBtn}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
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
  sortableHeader: {
    cursor: 'pointer',
    userSelect: 'none' as const,
    transition: 'background 0.2s',
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
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  editBtn: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  saveBtn: {
    background: '#28a745',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  cancelBtn: {
    background: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
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
  hideBtn: {
    background: '#ffc107',
    color: '#212529',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
  unhideBtn: {
    background: '#17a2b8',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
  editInput: {
    padding: '8px',
    border: '2px solid #667eea',
    borderRadius: '4px',
    fontSize: '14px',
    width: '100%',
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
  imageUploadContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    alignItems: 'center',
  },
  imageLabel: {
    padding: '8px 16px',
    background: '#f8f9fa',
    border: '2px solid #e9ecef',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    color: '#667eea',
  },
  smallImageLabel: {
    padding: '4px 8px',
    background: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    color: '#667eea',
    display: 'inline-block',
    marginTop: '4px',
  },
  fileInput: {
    display: 'none',
  },
  imagePreview: {
    width: '80px',
    height: '80px',
    objectFit: 'cover' as const,
    borderRadius: '6px',
    border: '2px solid #667eea',
  },
  tableThumbnail: {
    width: '60px',
    height: '60px',
    objectFit: 'cover' as const,
    borderRadius: '4px',
    border: '1px solid #e9ecef',
  },
  noImage: {
    fontSize: '11px',
    color: '#adb5bd',
    fontStyle: 'italic' as const,
  },
  tabContainer: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
  },
  tabButton: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    transition: 'all 0.3s ease',
  },
  tabButtonActive: {
    background: 'white',
    color: '#667eea',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
};
