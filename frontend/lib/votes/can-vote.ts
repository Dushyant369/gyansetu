/** Who may vote on an answer (upvote/downvote). Only block voting on your own answer. */
export function canVoteOnAnswer(answerAuthorId: string, currentUserId: string): boolean {
  if (!currentUserId || !answerAuthorId) return false
  return answerAuthorId !== currentUserId
}

export function canVoteOnQuestion(questionAuthorId: string, currentUserId: string): boolean {
  if (!currentUserId || !questionAuthorId) return false
  return questionAuthorId !== currentUserId
}
