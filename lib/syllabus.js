const fs = require('fs');
const path = require('path');

const syllabusPath = path.join(__dirname, '..', 'data', 'syllabus.json');
let syllabusData;

function loadSyllabus() {
  if (!syllabusData) {
    const raw = fs.readFileSync(syllabusPath, 'utf8');
    syllabusData = JSON.parse(raw);
  }
  return syllabusData;
}

function getSubjects() {
  const data = loadSyllabus();
  return data.subjects.map(({ id, name, description, chapters }) => ({ id, name, description, chapterCount: chapters.length }));
}

function getSubjectById(subjectId) {
  const data = loadSyllabus();
  return data.subjects.find(subject => subject.id === subjectId) || null;
}

function getChapter(subjectId, chapterId) {
  const subject = getSubjectById(subjectId);
  if (!subject) return null;
  return subject.chapters.find(chapter => chapter.id === chapterId) || null;
}

function searchSyllabus(query) {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) return { subjects: [], chapters: [], topics: [], exercises: [] };
  const subjects = [];
  const chapters = [];
  const topics = [];
  const exercises = [];
  const data = loadSyllabus();

  data.subjects.forEach(subject => {
    if (subject.name.toLowerCase().includes(normalized) || subject.description.toLowerCase().includes(normalized)) {
      subjects.push({ id: subject.id, name: subject.name, description: subject.description });
    }
    subject.chapters.forEach(chapter => {
      if (chapter.name.toLowerCase().includes(normalized) || chapter.summary.toLowerCase().includes(normalized)) {
        chapters.push({ subjectId: subject.id, subjectName: subject.name, id: chapter.id, name: chapter.name, summary: chapter.summary });
      }
      if (Array.isArray(chapter.topics)) {
        chapter.topics.forEach(topic => {
          if (topic.toLowerCase().includes(normalized)) {
            topics.push({ subjectId: subject.id, subjectName: subject.name, chapterId: chapter.id, chapterName: chapter.name, topic });
          }
        });
      }
      if (Array.isArray(chapter.exercises)) {
        chapter.exercises.forEach(exercise => {
          if (exercise.question.toLowerCase().includes(normalized) || exercise.solution.toLowerCase().includes(normalized)) {
            exercises.push({ subjectId: subject.id, subjectName: subject.name, chapterId: chapter.id, chapterName: chapter.name, id: exercise.id, question: exercise.question });
          }
        });
      }
    });
  });

  return { subjects, chapters, topics, exercises };
}

module.exports = { getSubjects, getSubjectById, getChapter, searchSyllabus };