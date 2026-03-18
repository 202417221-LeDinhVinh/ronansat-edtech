import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnswer {
    questionId: mongoose.Types.ObjectId;
    userAnswer: string;
    isCorrect: boolean;
}

export interface IResult extends Document {
    userId: mongoose.Types.ObjectId;
    testId: mongoose.Types.ObjectId;
    answers: IAnswer[];
    score: number;
    sectionBreakdown: {
        readingAndWriting: number;
        math: number;
    };
    date: Date;
}

const AnswerSchema: Schema<IAnswer> = new Schema({
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    userAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
});

const ResultSchema: Schema<IResult> = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        testId: { type: Schema.Types.ObjectId, ref: "Test", required: true },
        answers: [AnswerSchema],
        score: { type: Number, required: true },
        sectionBreakdown: {
            readingAndWriting: { type: Number, required: true },
            math: { type: Number, required: true },
        },
        date: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const Result: Model<IResult> = mongoose.models.Result || mongoose.model<IResult>("Result", ResultSchema);
export default Result;
