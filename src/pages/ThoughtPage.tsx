import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApp } from '../hooks/useApp';
import { getNotesForThought } from '../lib/storage';
import { COLOR_MAP, formatRelativeTime } from '../lib/engine';
import type { ThoughtColor } from '../lib/types';
import { ArrowLeft, Edit3, Send, Trash2, MessageCircle, Package } from 'lucide-react';

const COLOR_OPTIONS: { color: ThoughtColor; dot: string }[] = [
  { color: null, dot: 'bg-[#D7CCC8]' },
  { color: 'red', dot: 'bg-[#EF9A9A]' },
  { color: 'orange', dot: 'bg-[#FFB74D]' },
  { color: 'blue', dot: 'bg-[#81D4FA]' },
  { color: 'green', dot: 'bg-[#9CCC65]' },
  { color: 'purple', dot: 'bg-[#CE93D8]' },
];

export default function ThoughtPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    data,
    updateThought,
    deleteThought,
    addThoughtNote,
    deleteThoughtNote,
  } = useApp();

  const thought = data.thoughts.find((t) => t.id === id);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const noteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (thought) setEditContent(thought.content);
  }, [thought?.content]);

  if (!thought) {
    return (
      <div className="min-h-screen bg-[#FFF8E1] max-w-lg mx-auto flex flex-col items-center justify-center">
        <p className="text-[#8D6E63]">念头不存在</p>
        <button onClick={() => navigate('/')} className="mt-3 text-[#9CCC65] text-sm font-medium">返回首页</button>
      </div>
    );
  }

  const notes = getNotesForThought(thought.id);
  const linkedProject = thought.projectId
    ? data.projects.find((p) => p.id === thought.projectId)
    : null;
  const colorInfo = thought.color ? COLOR_MAP[thought.color] : null;

  function handleSaveEdit() {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    updateThought(thought!.id, { content: trimmed });
    setEditing(false);
  }

  function handleEditKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') setEditing(false);
  }

  function handleAddNote() {
    const trimmed = noteInput.trim();
    if (!trimmed) return;
    addThoughtNote(thought!.id, trimmed);
    setNoteInput('');
  }

  function handleNoteKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNote();
    }
  }

  function handleDelete() {
    if (window.confirm('删除这条念头及其所有备注？')) {
      deleteThought(thought!.id);
      navigate('/');
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8E1] max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="bg-[#FFF8E1] border-b border-[#E8D5B0] px-3 py-2.5 flex items-center gap-3 sticky top-0 z-30">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-[#F5E6C8] transition-colors"
        >
          <ArrowLeft size={20} className="text-[#8D6E63]" />
        </button>
        <span className="text-[15px] font-semibold text-[#4E342E] flex-1 truncate">念头详情</span>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-[#F5E6C8] transition-colors"
          >
            <Edit3 size={16} className="text-[#8D6E63]" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Thought card */}
        <div className="px-4 pt-4 pb-3">
          <div className="bg-[#FFFBEF] rounded-2xl p-4 card-shadow">
            {/* Meta row */}
            <div className="flex items-center gap-2 mb-3">
              {colorInfo && (
                <span className={`w-2.5 h-2.5 rounded-full ${colorInfo.dot} shrink-0`} />
              )}
              <span className="text-[11px] text-[#8D6E63]">
                {formatRelativeTime(thought.createdAt)}
              </span>
              {thought.processed && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#C8E6C9] text-[#2E7D32]">已整理</span>
              )}
            </div>

            {/* Content (editable) */}
            {editing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  className="w-full text-sm text-[#4E342E] bg-[#FFF8E1] rounded-xl px-3 py-2 border border-[#E8D5B0] outline-none focus:ring-2 focus:ring-[#9CCC65]/30"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-1.5 bg-[#9CCC65] text-white text-xs font-medium rounded-full hover:bg-[#8BC34A] transition-colors"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => { setEditing(false); setEditContent(thought.content); }}
                    className="px-4 py-1.5 bg-[#F5E6C8] text-[#8D6E63] text-xs font-medium rounded-full hover:bg-[#E8D5B0] transition-colors"
                  >
                    取消
                  </button>
                  {/* Color picker in edit mode */}
                  <div className="flex items-center gap-1 ml-auto">
                    {COLOR_OPTIONS.map((opt) => (
                      <button
                        key={String(opt.color)}
                        onClick={() => updateThought(thought.id, { color: opt.color })}
                        className={`w-5 h-5 rounded-full ${opt.dot} transition-transform ${
                          thought.color === opt.color ? 'ring-2 ring-[#9CCC65] ring-offset-1 scale-110' : 'hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[15px] text-[#4E342E] leading-relaxed whitespace-pre-wrap">
                {thought.content}
              </p>
            )}
          </div>

          {/* Linked project */}
          {linkedProject && (
            <button
              onClick={() => navigate(`/project/${linkedProject.id}`)}
              className="mt-3 w-full bg-[#C8E6C9]/50 rounded-2xl px-4 py-3 flex items-center gap-3 hover:bg-[#C8E6C9] transition-colors text-left"
            >
              <Package size={16} className="text-[#689F38] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-[#8D6E63]">关联项目</p>
                <p className="text-sm font-medium text-[#4E342E] truncate">{linkedProject.name}</p>
              </div>
            </button>
          )}
        </div>

        {/* Notes section */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={14} className="text-[#8D6E63]" />
            <h3 className="text-xs font-semibold text-[#8D6E63] uppercase tracking-wider">
              备注记录
              {notes.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-[#F5E6C8] px-1.5 py-0.5 rounded-full">
                  {notes.length}
                </span>
              )}
            </h3>
          </div>

          {/* Note list */}
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-[#A1887F]">还没有备注</p>
              <p className="text-[11px] text-[#D7CCC8] mt-1">念头可以持续生长，像朋友圈评论一样记录后续想法</p>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {notes.map((note) => (
                <div key={note.id} className="bg-[#FFFBEF] rounded-2xl px-4 py-3 card-shadow flex items-start gap-3 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#4E342E] whitespace-pre-wrap">{note.content}</p>
                    <span className="text-[10px] text-[#A1887F] mt-1 block">
                      {formatRelativeTime(note.createdAt)}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteThoughtNote(note.id)}
                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-[#D7CCC8] hover:text-[#EF9A9A] opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add note input */}
          <div className="flex items-center gap-2 bg-[#FFFBEF] rounded-2xl px-4 py-2 border border-[#E8D5B0]">
            <input
              ref={noteInputRef}
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={handleNoteKeyDown}
              placeholder="添加备注..."
              className="flex-1 bg-transparent text-sm text-[#4E342E] placeholder-[#A1887F] outline-none"
            />
            {noteInput.trim() && (
              <button
                onClick={handleAddNote}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#9CCC65] text-white hover:bg-[#8BC34A] transition-colors"
              >
                <Send size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete footer */}
      <div className="px-4 pb-6 pt-2">
        <button
          onClick={handleDelete}
          className="w-full py-2.5 bg-[#FFEBEE] text-[#EF9A9A] text-sm font-medium rounded-2xl hover:bg-[#FFCDD2] transition-colors flex items-center justify-center gap-1.5"
        >
          <Trash2 size={14} />
          删除念头
        </button>
      </div>
    </div>
  );
}
