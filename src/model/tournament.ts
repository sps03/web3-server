import { Schema, model, Document } from 'mongoose';
import type { Tournament } from '../types/tournaments';

const tournamentSchema = new Schema<Tournament>({

    tournamentId: {
        type: String,
        required: true,
    },
    map: {
        type: String,
        required: true,
    },
    gameType: {
        type: String,
        required: true,
    },
    mathDuration: {
        type: Number,
        required: true,
    },
    goal: {
        target: {
            type: Number,
            required: true,
        },
        for: {
            type: String,
            enum: ['kills', 'headshot'],
        },
    },
    bonus: {
        amount: {
            type: Number,
            required: true,
        },
        chain: {
            type: String,
            required: true,
        }
    },
    xpLevel: {
        type: Number,
        required: true,
    },
    entryFee: {
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            required: true,
        }
    },
    players: {
        type: Number,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },

    participants: {
        type: [String],
    },
});

const Tournament = model<Tournament>('Tournament', tournamentSchema);

export default Tournament;