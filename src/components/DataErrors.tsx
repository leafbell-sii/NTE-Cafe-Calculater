import type { DataError } from '../data/load';

export function DataErrors({ errors }: { errors: DataError[] }) {
  return (
    <div className="app">
      <main className="data-errors panel">
        <h1>데이터 오류</h1>
        <p>
          <code>src/data/*.json</code> 검증에 실패해서 계산하지 않았습니다. 아래 항목을 고쳐 주세요.
        </p>
        <table>
          <thead>
            <tr>
              <th>파일</th>
              <th>항목</th>
              <th>내용</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((e, i) => (
              <tr key={i}>
                <td>
                  <code>{e.file}</code>
                </td>
                <td>
                  <code>{e.path}</code>
                </td>
                <td>{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
