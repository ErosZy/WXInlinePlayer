import StreamLoader from './stream';
import ChunkLoader from './chunk';

function Loader({ type = 'chunk', opt }) {
  return type == 'chunk' ? new ChunkLoader(opt) : new StreamLoader(opt);
}

window.Loader = Loader;
export default Loader;
