import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Using an existing icon like SparklesIcon or UserCircleIcon for the logo placeholder,
// ideally replace with actual BonhoefferLogoDataURI if available or define here.

const BonhoefferLogoURL = "https://lh3.googleusercontent.com/fife/ALs6j_Fa2v9wf4nQm0ikochA4bCGfscrsu2KxigQWxICdNIQIJvE5qLLVCWbSTz_ys0ORoGQgqQRGComg7JFMI0enFFY1qix-zF3GdJorXtbgiZYIpFNTXRiMj5dfCsVmAimI8DQ3Qn6goSoCMvpjqkDMM4xzRW7UUamRD1x0daZzfpMlsGO39C7swm9LDyYN_aq7_1-BAcHsJg7sekpPPm_Z1o4Okz4xbMXjCpqQuXEiM_YjJ4XJzPaejo4H5zQgdy1WrGcj0qQLpsfkLo50nuQkMa274xfzuuCscLfozQxTezK-Qdnd2Ge2KtfMHeOie6ELweQp03SerTjLuwu5p-UfTtZa5dOzrnbK4dsYFIepewFep9RGxwPP61wTXrlN0z9YaYtvEoGEfykaAzRV9Flsr3aJWMolhnYU-nbibYurzkSlFI4lzrCjs_3LUWEN7O2Dja8twe-uEpQXDVq9qtD92DKbswq3LaT_oBOBNADPErzg-OV8PhmcQVm0FfIL4ffudaltrxPfIMvQyTWDnSiRoTWNuFYjFRw0-aTzkyNRh3uVk9QobqB3dXu1r-iaeIYsP7PA5l4-gH59ab6529n1nBna8BBimnLXCGY4LRC-8TQhcxH63c_qgLNST_iRnf50aYRlHBInKunmrh0kEjS2dlud8D29vZdEmE0TMJ7ABFV9t4rbSwuJVO9Ne6uYZB7Jsvghwyy1ddUsti_c8hDWD4wkDFhA1cl13sxN0Ogd3TEZ3ycME64_aovB59WVhS0U4EzEcNHy6kRntXFu9NwOiWhy_cWbkhQiN6PGf_RiZVr42BF0hmLmwrVJEpSLJ4srDq_lbH8favC8j5FAluWB2K3iwDZWjbc77u8056XqDzM6p-Qd5UxlZ_JtsI5ax2D-Kv6zsR0s6HwFAWJBgZ_CUjjGWX5XZ4Oh8HML-21Wt2kwLPjlmRzYul2gsFH8pqL1PwyCstcW5_O9qiH-rCmJoRzkdbag-dZWFGluwbUKRIZ0YQvFQCqAWpkmIm3mjcuniiUnSEgiAhqgM0D_JX8ZeQD63gQM69FWWPKoDJ1Y6ZFxV8wRfr9iL-exz-L94u9XnmyfAV65glJrZz-JW0gDBLNNAkY-2QmxsaZYapOz9df9Aqq2BlHVcuitrTq0_gRcelv_QTfk9tkOxt0KHxu0BUG7jOSJIdQKxqasBtyjUPA7vMaqFM1CQzpnbhdXm22jnMU1A5I6JLOG4LRuo3R59AmAUbo03_83NDUsaFH_CnfjDqQtOe-5oP2S8eJo8ARNDGX0AuTv_NclpFTxkA0cwDEmxLH9CrDTSpYY4lJ6i4sNjteiZV1lN6C_IRt8oco4-huS76Zu_hxrMBaLIofC-_V_6EbUoM8PFdQ0NEkSMzgrg6aSTqmHfJIsMCdvydMdZeTEAHbcatXweKBK5bvSd36a8Q4XneiKQuglab-uB6QzY3BEjKKsoBKBCwZubMpGVfGMEKsTcUixJdLXAlc2HX5kqpwHrcod4pX_HkiAB9HGzImJ65m7Cp-RJTgZ5PNW85Xr34W7tCfJFSC8xL8MlEuYTHePPVviSvIt_PO7ICUEQbeu_L-p4k-0jJbPfbOCe_yeQDwfjazFiysSimGV76K0qtWaWkc-MpH=w1920-h868?auditContext=prefetch";


const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md">
        <div className="bg-neutral-700/70 backdrop-blur-md shadow-2xl rounded-xl p-8 md:p-10 border border-neutral-600/50">
          <div className="flex flex-col items-center mb-8">
             <img 
              src={BonhoefferLogoURL} 
              alt="Bonhoeffer Machines Logo" 
              className="h-20 w-auto mb-6" // Increased size
            />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-amber-300 text-center">
              Bonhoeffer SCM
            </h1>
            <p className="text-neutral-300 text-center mt-2">Access Your Supply Chain Dashboard</p>
          </div>

          {error && (
            <div className="bg-danger/20 border border-danger text-danger px-4 py-3 rounded-md relative mb-6" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-md shadow-sm text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-md shadow-sm text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-neutral-900 bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 focus:ring-primary disabled:bg-neutral-500 disabled:text-neutral-400 transition-colors duration-150"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neutral-800"></div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
        </div>
         <p className="mt-8 text-center text-sm text-neutral-400">
            &copy; {new Date().getFullYear()} Bonhoeffer Machines Pvt. Ltd.
          </p>
      </div>
    </div>
  );
};

export default LoginPage;