import React, { FC } from 'react';
import type { Issue } from '../lib/types';
import { IssueCard } from './IssueCard';

export const IssueFeed: FC<{ issues: Issue[]; onSelectIssue: (issue: Issue) => void }> = ({ issues, onSelectIssue }) => {
  return (
    <div className="issue-feed">
      {issues.map(issue => <IssueCard key={issue.id} issue={issue} onSelect={onSelectIssue} />)}
    </div>
  );
};
