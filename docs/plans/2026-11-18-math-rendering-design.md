# Math rendering design

Approved: use KaTeX for inline and display formulas with dollar and LaTeX bracket delimiters. Preserve code verbatim and do not render unfinished streamed formulas.

Integrate remark-math and rehype-katex in message and reasoning Markdown. Bundle CSS/fonts locally. Normalize paired bracket delimiters outside Markdown code ranges. Keep original stored response unchanged. Display wide formulas with horizontal overflow and keep malformed formulas readable without throwing.
