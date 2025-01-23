// services/lifeEvents.js
const lifeEvents = require('../config/lifeEvents.json');

function getLifeEventsForUser(user) {
  const userGender = user.gender?.toLowerCase() || 'both';
  const birthDate  = user.dob;  // a real JS Date
  const babyName   = user.name;

  return lifeEvents
    .filter(evt => evt.gender === 'both' || evt.gender.toLowerCase() === userGender)
    .map(evt => {
      const eventDate = addMonthsToDate(birthDate, evt.months_from_birth);
      const time = eventDate.toISOString().split('T')[0]; // "YYYY-MM-DD" for Lightweight Charts
      const text = evt.sentence.replace('{babyName}', babyName);
      return { time, text };
    });
}

function addMonthsToDate(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

module.exports = { getLifeEventsForUser };