import React, { useState } from 'react';
import axios from 'axios';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadLink, setDownloadLink] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleExtract = async () => {
    if (!file) {
      alert('Please upload a file first');
      return;
    }

    setLoading(true);
    setProgress(0);

    // Create FormData to send the file
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/extract-emails', formData, {
        responseType: 'blob', // to handle file download
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });

      // Create a link to download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setDownloadLink(url);
    } catch (error) {
      console.error('Error during extraction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Email Extraction Tool</h1>
      <input
        type="file"
        onChange={handleFileChange}
        style={styles.fileInput}
      />
      <button
        onClick={handleExtract}
        disabled={loading}
        style={styles.button}
      >
        {loading ? 'Extracting...' : 'Extract Emails'}
      </button>
      {loading && (
        <div style={styles.progressContainer}>
          <div style={{ ...styles.progressBar, width: `${progress}%` }} />
        </div>
      )}
      {downloadLink && (
        <a
          href={downloadLink}
          download="extracted_emails.xlsx"
          style={styles.downloadLink}
        >
          Download Extracted Emails
        </a>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    maxWidth: '500px',
    margin: 'auto',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#f9f9f9'
  },
  header: {
    marginBottom: '20px',
    fontSize: '24px',
    color: '#333'
  },
  fileInput: {
    marginBottom: '20px'
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    outline: 'none'
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed'
  },
  progressContainer: {
    width: '100%',
    backgroundColor: '#ddd',
    borderRadius: '4px',
    overflow: 'hidden',
    margin: '20px 0'
  },
  progressBar: {
    height: '10px',
    backgroundColor: '#28a745',
    transition: 'width 0.3s'
  },
  downloadLink: {
    marginTop: '20px',
    fontSize: '16px',
    color: '#007bff',
    textDecoration: 'none'
  }
};

export default FileUpload;
