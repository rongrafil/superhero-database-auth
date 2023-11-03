import { userService } from 'services';
import { Link } from 'components';
import { Amplify } from 'aws-amplify'; // update

export default Home;

function Home() {
    return (
        <div className="p-4">
            <div className="container">
                <h1>Hi {userService.userValue?.username}!</h1>
                <p>You&apos;re logged in with Next.js & JWT!!</p>
                <p><Link href="/users">Manage Heroes</Link></p>
            </div>
        </div>
    );
}
