import json

EXCLUDED_PREFIXES = ['examples/']

try:
    with open('test-results/coverage/coverage.json') as f:
        data = json.load(f)

        total_stmts = 0
        total_covered = 0

        filtered_files = {}

        for filename, file_data in data['files'].items():
            # Check exclusions
            exclude = False
            for prefix in EXCLUDED_PREFIXES:
                if filename.startswith(prefix) or f"/{prefix}" in filename:
                    exclude = True
                    break

            if exclude:
                continue

            summary = file_data['summary']
            stmts = summary['num_statements']
            covered = summary['covered_lines']

            total_stmts += stmts
            total_covered += covered
            filtered_files[filename] = summary['percent_covered']

        avg_coverage = (total_covered / total_stmts * 100) if total_stmts > 0 else 0

        print(f"Adjusted Overall Coverage: {avg_coverage:.2f}%")
        print("-" * 50)

        sorted_files = sorted(filtered_files.items(), key=lambda x: x[1])
        for file, pct in sorted_files:
            print(f"{file}: {pct:.2f}%")

except Exception as e:
    print(f"Error: {e}")
