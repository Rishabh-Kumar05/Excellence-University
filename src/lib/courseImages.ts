import heroCapImg from '../assets/images/hero_graduation_cap_1794584776207.jpg';
import csImg from '../assets/images/course_computer_science_1794584776722.jpg';
import archImg from '../assets/images/course_architecture_1794584777409.jpg';
import econImg from '../assets/images/course_economics_1794584777541.jpg';

export const HERO_GRADUATION_IMAGE = heroCapImg;

export function getCourseImage(imageKey: string): string {
  switch (imageKey) {
    case 'architecture':
      return archImg;
    case 'economics':
      return econImg;
    case 'cs':
    default:
      return csImg;
  }
}
