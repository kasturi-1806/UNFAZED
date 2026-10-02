const generateSlots = ({
  startTime,
  endTime,
  sessionDuration,
  bufferMinutes,
}) => {
  const slots = [];

  const [startHour, startMinute] = startTime
    .split(":")
    .map(Number);

  const [endHour, endMinute] = endTime
    .split(":")
    .map(Number);

  let currentMinutes = startHour * 60 + startMinute;

  const endMinutes = endHour * 60 + endMinute;

  const slotLength = sessionDuration + bufferMinutes;

  while (currentMinutes + sessionDuration <= endMinutes) {
    const startHour24 = Math.floor(currentMinutes / 60);
    const startMinuteValue = currentMinutes % 60;

    const sessionEndMinutes =
      currentMinutes + sessionDuration;

    const endHour24 = Math.floor(sessionEndMinutes / 60);
    const endMinuteValue = sessionEndMinutes % 60;

    const formatTime = (hour, minute) => {
      return `${String(hour).padStart(2, "0")}:${String(
        minute
      ).padStart(2, "0")}`;
    };

    slots.push({
      startTime: formatTime(
        startHour24,
        startMinuteValue
      ),
      endTime: formatTime(
        endHour24,
        endMinuteValue
      ),
    });

    currentMinutes += slotLength;
  }

  return slots;
};

module.exports = generateSlots;