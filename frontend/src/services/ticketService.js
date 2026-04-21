import axios from 'axios';

const API = 'http://localhost:8080/api/tickets';

function getAuthHeader() {
  const token = localStorage.getItem('jwt_token');
  return { Authorization: `Bearer ${token}` };
}

// Convert a File object to a base64 string
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

// Create a new ticket
export async function createTicket(payload) {
  const res = await axios.post(API, payload, { headers: getAuthHeader() });
  return res.data;
}

// Get all tickets (admin/technician)
export async function getAllTickets() {
  const res = await axios.get(API, { headers: getAuthHeader() });
  return res.data;
}

// Get my tickets (regular user)
export async function getMyTickets() {
  const res = await axios.get(`${API}/mine`, { headers: getAuthHeader() });
  return res.data;
}

// Get a single ticket by id
export async function getTicketById(id) {
  const res = await axios.get(`${API}/${id}`, { headers: getAuthHeader() });
  return res.data;
}

// Update ticket status (admin/technician only)
export async function updateTicketStatus(id, status) {
  const res = await axios.patch(`${API}/${id}/status`, { status }, { headers: getAuthHeader() });
  return res.data;
}

// Add a comment to a ticket
export async function addComment(ticketId, body) {
  const res = await axios.post(`${API}/${ticketId}/comments`, { body }, { headers: getAuthHeader() });
  return res.data;
}
