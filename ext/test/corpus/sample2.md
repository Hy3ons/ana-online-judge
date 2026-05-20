# 표가 있는 문제

| 입력 | 의미 |
|------|------|
| N    | 정점 수 |
| M    | 간선 수 |

## 알고리즘 단계

1. 그래프 입력
2. **DFS** 수행
3. 결과 출력

코드 예:

```python
def dfs(g, v, visited):
    visited[v] = True
    for u in g[v]:
        if not visited[u]:
            dfs(g, u, visited)
```
