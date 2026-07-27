import os
import re

COMPOSE_FILE_PATTERN = re.compile(r"^docker-compose.*\.ya?ml$", re.IGNORECASE)

def process_compose_file(file_path: str) -> None:
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    modified = False
    new_lines = []
    
    i = 0
    n = len(lines)

    while i < n:
        line = lines[i]
        
        ports_match = re.match(r"^(\s*)ports\s*:\s*$", line)
        if ports_match:
            base_indent = len(ports_match.group(1))
            
            j = i + 1
            port_items = []
            has_mapped_port = False
            
            while j < n:
                next_line = lines[j]
                stripped = next_line.strip()
                
                if not stripped or stripped.startswith("#"):
                    j += 1
                    continue
                
                next_indent = len(next_line) - len(next_line.lstrip(" "))
                
                if next_indent <= base_indent:
                    break
                
                is_unmapped = re.match(r"^\s*-\s*['\"]?\d+['\"]?\s*(?:#.*)?$", next_line)
                
                if is_unmapped:
                    port_items.append(next_line)
                else:
                    has_mapped_port = True
                    port_items.append(next_line)
                
                j += 1
            
            if port_items and not has_mapped_port:
                new_lines.append(f"{' ' * base_indent}expose:\n")
                new_lines.extend(port_items)
                modified = True
                i = j
                continue
            elif has_mapped_port:
                new_lines.append(line)
                new_lines.extend(port_items)
                i = j
                continue

        new_lines.append(line)
        i += 1

    if new_lines and not new_lines[-1].endswith("\n"):
        new_lines[-1] += "\n"
        modified = True

    if modified:
        with open(file_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        print(f"[ UPDATED ] {file_path}")
    else:
        print(f"[ NO CHANGE ] {file_path}")


def main(root_dir: str = "."):
    print(f"Scanning directory '{os.path.abspath(root_dir)}' recursively...\n")
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if COMPOSE_FILE_PATTERN.match(filename):
                process_compose_file(os.path.join(dirpath, filename))


if __name__ == "__main__":
    main()