import API from './axios.custom';

export const getAuditLogsAPI = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.actorId) params.append('actorId', filters.actorId);
  if (filters.action) params.append('action', filters.action);
  if (filters.targetType) params.append('targetType', filters.targetType);
  if (filters.targetId) params.append('targetId', filters.targetId);
  if (filters.fromDate) params.append('fromDate', filters.fromDate);
  if (filters.toDate) params.append('toDate', filters.toDate);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  const queryString = params.toString();
  const endpoint = queryString ? `/audit-log?${queryString}` : '/audit-log';

  const res = await API.get(endpoint);
  return res.data;
};