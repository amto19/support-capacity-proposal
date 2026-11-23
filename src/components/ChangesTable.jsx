import { signed } from '../format.js';
import { NOT_YET_ASSIGNED } from '../text/planText.js';
import SourceTag from './SourceTag.jsx';

// Today, proposed and change for every task, plus unallocated and total.
// Repeats the bars' numbers so nobody has to read them from the bars.
// showSources: label the Today column as Baseline and the Proposed column as Estimate (summary only).
export default function ChangesTable({ plan, showSources = false }) {
  return (
    <table className="changes-table">
      <caption>Weekly team hours, today and proposed</caption>
      <thead>
        <tr>
          <th scope="col">Task</th>
          <th scope="col">
            Today
            {showSources && <SourceTag kind="baseline" compact />}
          </th>
          <th scope="col">
            Proposed
            {showSources && <SourceTag kind="estimate" compact />}
          </th>
          <th scope="col">Change</th>
        </tr>
      </thead>
      <tbody>
        {plan.tasks.map((task) => (
          <tr key={task.id}>
            <th scope="row">{task.name}</th>
            <td>{task.today}</td>
            <td>{task.proposed}</td>
            <td>{signed(task.change)}</td>
          </tr>
        ))}
        <tr>
          <th scope="row">{NOT_YET_ASSIGNED}</th>
          <td>{plan.unallocatedRow.today}</td>
          <td>{plan.unallocatedRow.proposed}</td>
          <td>{signed(plan.unallocatedRow.change)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Total</th>
          <td>{plan.totalRow.today}</td>
          <td>{plan.totalRow.proposed}</td>
          <td>{signed(plan.totalRow.change)}</td>
        </tr>
      </tfoot>
    </table>
  );
}
