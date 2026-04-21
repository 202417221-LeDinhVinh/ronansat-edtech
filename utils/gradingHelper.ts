// Chấm điểm

type GradingQuestion = {    // Định nghĩa 1 câu hỏi trong hệ thống có loại câu, đáp án Trắc/Tự luận, đáp án đúng là gì
  questionType?: string;
  correctAnswer?: string;
  choices?: string[];
  sprAnswers?: string[];
};

function normalizeText(value?: string | null) {    // trim + lowercase tất cả input
  return value?.trim().toLowerCase() ?? "";
}

function getChoiceIndexFromCode(value?: string | null) {    // nếu input là choice_2 thì tách ra lấy số 2
  const match = value?.match(/^choice_(\d+)$/i);
  return match ? Number(match[1]) : -1;
}

function isMultipleChoiceCorrect(question: GradingQuestion, userAnswer: string) { // Chấm điểm Trắc nghiệm  
  const correctAnswer = question.correctAnswer ?? "";                             // lấy danh sách câu hỏi + đáp án đúng
  const choices = Array.isArray(question.choices) ? question.choices : [];  

  const userChoiceIndex = getChoiceIndexFromCode(userAnswer);            // lấy số của đáp user chọn -> choice_2 thì lấy 2
  const correctChoiceIndex = getChoiceIndexFromCode(correctAnswer);      // giống trên nhưng cho đáp án đúng, nếu cái nào là tự luận thì nhận -1 thôi

  if (userChoiceIndex >= 0 && correctChoiceIndex >= 0) {   // cả 2 đều dạng format choice_1
    return userChoiceIndex === correctChoiceIndex;
  }

  if (userChoiceIndex >= 0 && correctChoiceIndex < 0) {     // nếu user choice dạng choice_0 còn đáp án lưu ở dạng tự luận thì normalize choice của user r và đáp án đúng và check xem có = nhau k
    const selectedChoiceText = choices[userChoiceIndex];
    return normalizeText(selectedChoiceText) === normalizeText(correctAnswer);
  }

  if (userChoiceIndex < 0 && correctChoiceIndex >= 0) {          // Trường hợp ngược lại ở trên, xử lý như nhau
    const correctChoiceText = choices[correctChoiceIndex];
    return normalizeText(userAnswer) === normalizeText(correctChoiceText);
  }

  // Case 4: cả 2 đáp đúng và user chọn đều dùng text thì check bản normalized của cả 2 cái
  return normalizeText(userAnswer) === normalizeText(correctAnswer);
}


export const checkIsCorrect = (question: GradingQuestion, userAnswer: string) => {
  if (!userAnswer || userAnswer === "Omitted") {   // Bỏ qua = auto sai
    return false;
  }

  // nếu là tự luận => Duyệt qua mọi đáp án cho phép
  if (question.questionType === "spr") {        
    return (
      question.sprAnswers?.some((answer) => normalizeText(answer) === normalizeText(userAnswer)) ??   // some sẽ duyệt qua mọi đáp án được cho phép, đúng 1 cái là true
      false
    );
  }

  return isMultipleChoiceCorrect(question, userAnswer);   // k tức là đây là câu trắc nghiệm => Gọi hàm này để check
};
 
export function getChoiceCode(choiceIndex: number) {   // vd nhận vào số 2 ghép thành choice_2
  return `choice_${choiceIndex}`;
}

export function getChoiceTextFromStoredAnswer(question: GradingQuestion, storedAnswer?: string | null) {
  const choiceIndex = getChoiceIndexFromCode(storedAnswer);
  if (choiceIndex >= 0) {        // Nếu đây là câu trắc nghiệm thì trả về nội dung của đáp án thay vì trả về choice_2
    return question.choices?.[choiceIndex] ?? storedAnswer ?? "";
  }

  return storedAnswer ?? "";
}
