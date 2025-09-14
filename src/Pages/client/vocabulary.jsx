import React, { useState } from 'react';
import { Plus, Minus, Search, Edit, Trash2, BookOpen, X, Check } from 'lucide-react';

const Vocabulary = () => {
  // TODO: Call API to fetch topics
  const [topics, setTopics] = useState([]);
  
  // TODO: Call API to fetch vocabularies
  const [vocabularies, setVocabularies] = useState([]);
  
  const [newTopic, setNewTopic] = useState('');
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showDeleteTopics, setShowDeleteTopics] = useState(false);
  const [showEditTopic, setShowEditTopic] = useState(false);
  const [selectedTopicIds, setSelectedTopicIds] = useState([]);
  const [topicToEdit, setTopicToEdit] = useState(null);

  const [newVocabulary, setNewVocabulary] = useState({
    word: '',
    type: '',
    phonetic: '',
    meaning: '',
    example: ''
  });
  const [showAddVocabulary, setShowAddVocabulary] = useState(false);
  const [showEditVocabulary, setShowEditVocabulary] = useState(false);
  const [vocabToEdit, setVocabToEdit] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  // ============= TOPIC HANDLERS =============
  const handleAddTopic = () => {
    // TODO: Call API to add topic
    setShowAddTopic(false);
    setNewTopic('');
  };

  const handleDeleteTopics = () => {
    // TODO: Call API to delete topics
    setShowDeleteTopics(false);
    setSelectedTopicIds([]);
  };

  const handleEditTopic = () => {
    // TODO: Call API to edit topic
    setShowEditTopic(false);
    setTopicToEdit(null);
  };

  const handleSelectTopic = (topicId) => {
    const updatedTopics = topics.map(topic => ({
      ...topic,
      isSelected: topic.id === topicId
    }));
    setTopics(updatedTopics);
  };

  const handleSelectTopicForDeletion = (topicId) => {
    if (selectedTopicIds.includes(topicId)) {
      setSelectedTopicIds(selectedTopicIds.filter(id => id !== topicId));
    } else {
      setSelectedTopicIds([...selectedTopicIds, topicId]);
    }
  };

  // ============= VOCABULARY HANDLERS =============
  const handleAddVocabulary = () => {
    // TODO: Call API to add vocabulary
    setShowAddVocabulary(false);
    setNewVocabulary({ word: '', type: '', phonetic: '', meaning: '', example: '' });
  };

  const handleDeleteVocabulary = (id) => {
    // TODO: Call API to delete vocabulary
  };

  const handleEditVocabulary = () => {
    // TODO: Call API to edit vocabulary
    setShowEditVocabulary(false);
    setVocabToEdit(null);
  };

  // ============= FILTERING =============
  const selectedTopic = topics.find(topic => topic.isSelected);
  const filteredVocabularies = selectedTopic
    ? vocabularies.filter(vocab =>
        vocab.topicId === selectedTopic.id &&
        (
          vocab.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vocab.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vocab.example.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-6 flex items-center">
          <BookOpen className="mr-3" /> Từ Vựng IELTS
        </h1>

        {/* Header: Topics */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-700">Chủ đề</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddTopic(true)}
                className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={() => setShowDeleteTopics(true)}
                className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full"
              >
                <Minus size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {topics.map(topic => (
              <div key={topic.id} className="flex items-center space-x-2">
                <button
                  onClick={() => handleSelectTopic(topic.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    topic.isSelected
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {topic.name}
                </button>
                <button
                  onClick={() => {
                    setTopicToEdit(topic);
                    setShowEditTopic(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Add Topic */}
        {showAddTopic && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Thêm chủ đề mới</h3>
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md mb-4"
                placeholder="Tên chủ đề mới"
              />
              <div className="flex justify-end space-x-2">
                <button onClick={() => setShowAddTopic(false)} className="px-4 py-2 text-slate-600">
                  Hủy
                </button>
                <button onClick={handleAddTopic} className="px-4 py-2 bg-slate-800 text-white rounded-md">
                  Thêm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Edit Topic */}
        {showEditTopic && topicToEdit && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Sửa chủ đề</h3>
              <input
                type="text"
                value={topicToEdit.name}
                onChange={(e) => setTopicToEdit({ ...topicToEdit, name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-md mb-4"
              />
              <div className="flex justify-end space-x-2">
                <button onClick={() => setShowEditTopic(false)} className="px-4 py-2 text-slate-600">
                  Hủy
                </button>
                <button onClick={handleEditTopic} className="px-4 py-2 bg-blue-600 text-white rounded-md">
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bảng từ vựng */}
        {selectedTopic && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-700">Từ vựng: {selectedTopic.name}</h2>
              <div className="flex space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-md"
                  />
                </div>
                <button
                  onClick={() => setShowAddVocabulary(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <Plus size={18} className="mr-1" /> Thêm từ
                </button>
              </div>
            </div>

            {filteredVocabularies.length > 0 ? (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Từ vựng</th>
                    <th className="px-6 py-3">Loại từ</th>
                    <th className="px-6 py-3">Phonetic</th>
                    <th className="px-6 py-3">Nghĩa</th>
                    <th className="px-6 py-3">Ví dụ</th>
                    <th className="px-6 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVocabularies.map(vocab => (
                    <tr key={vocab.id} className="border-b">
                      <td className="px-6 py-4">{vocab.word}</td>
                      <td className="px-6 py-4">{vocab.type}</td>
                      <td className="px-6 py-4">{vocab.phonetic}</td>
                      <td className="px-6 py-4">{vocab.meaning}</td>
                      <td className="px-6 py-4">{vocab.example}</td>
                      <td className="px-6 py-4 flex space-x-2">
                        <button
                          onClick={() => {
                            setVocabToEdit(vocab);
                            setShowEditVocabulary(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteVocabulary(vocab.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-slate-500">Chưa có từ vựng nào.</p>
            )}
          </div>
        )}

        {/* Modal Add Vocabulary */}
        {showAddVocabulary && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Thêm từ vựng</h3>
              {/* TODO: Input fields for vocabulary */}
              <div className="flex justify-end space-x-2 mt-6">
                <button onClick={() => setShowAddVocabulary(false)} className="px-4 py-2 text-slate-600">
                  Hủy
                </button>
                <button onClick={handleAddVocabulary} className="px-4 py-2 bg-slate-800 text-white rounded-md">
                  Thêm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Edit Vocabulary */}
        {showEditVocabulary && vocabToEdit && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Sửa từ vựng</h3>
              {/* TODO: Input fields for editing vocabulary */}
              <div className="flex justify-end space-x-2 mt-6">
                <button onClick={() => setShowEditVocabulary(false)} className="px-4 py-2 text-slate-600">
                  Hủy
                </button>
                <button onClick={handleEditVocabulary} className="px-4 py-2 bg-blue-600 text-white rounded-md">
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Vocabulary;
