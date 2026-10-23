import { categoryPresentation } from "@/utils/category-presentation";
import "./CategoryLabel.css";

export default function CategoryLabel({ name }) {
  const category = categoryPresentation(name);
  return <span className="category-label">
    {category.emoji && <span className="category-label__emoji" aria-hidden="true">{category.emoji}</span>}
    <span className="category-label__name">{category.name}</span>
  </span>;
}
